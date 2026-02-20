(function () {
  const RUN_CONFIG = {
    RUN_LENGTH: 8,
    RECOMMENDED_COUNT: 2,
    CHALLENGE_COUNT: 1,
    WILDCARD_COUNT: 1,
    RANDOMNESS_SEED_MODE: 'run',
    RANDOMNESS_WEIGHT: 0.25
  };

  function hashString(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function getRunSeed(seedMode = RUN_CONFIG.RANDOMNESS_SEED_MODE) {
    if (seedMode === 'daily') {
      const now = new Date();
      const daily = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
      return hashString(daily);
    }
    return hashString(`${Date.now()}-${Math.random()}`);
  }

  function createRunId(seed) {
    return `run-${Date.now()}-${seed}`;
  }

  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), t | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildMissionInsights(mission) {
    const totals = { economic: 0, sustainability: 0, culture: 0, hospitality: 0, satisfaction: 0 };
    (mission.options || []).forEach(option => {
      Object.keys(totals).forEach(cat => {
        totals[cat] += option.deltas?.[cat] || 0;
      });
    });
    const count = Math.max((mission.options || []).length, 1);
    const avg = {};
    Object.keys(totals).forEach(cat => {
      avg[cat] = totals[cat] / count;
    });
    return avg;
  }

  function computePitfallFlags(state, constants) {
    const flags = [];
    const values = Object.values(state.categories);
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (max - min > constants.vMaxVarianceTop) flags.push('HighVariance');

    const avgOther = (state.categories.economic + state.categories.sustainability + state.categories.hospitality + state.categories.satisfaction) / 4;
    if (state.categories.culture + 1 < avgOther) flags.push('NeglectCulture');

    if (state.categories.economic - avgOther >= 4) flags.push('EconomicOverIndex');

    const decisions = Math.max(1, state.decisionCount || 0);
    const spendPerDecision = (state.impactPointsSpent || 0) / decisions;
    if (spendPerDecision > 70 && state.BII < 60) flags.push('BudgetInefficient');

    return flags;
  }

  function buildDiagnosis(state, sampledMissions, constants) {
    const entries = Object.entries(state.categories).sort((a, b) => a[1] - b[1]);
    const minValue = entries[0][1];
    const maxValue = entries[entries.length - 1][1];
    const lowestCategories = entries.filter(([, value]) => value === minValue).map(([key]) => key);
    const flags = computePitfallFlags(state, constants);
    const variance = maxValue - minValue;

    let recommendedFocus = 'Balance';
    if (lowestCategories.length === 1 && variance > 1) {
      recommendedFocus = lowestCategories[0];
    }

    const highestCategory = entries[entries.length - 1][0];
    const remediationMissions = pickRemediationMissions({
      recommendedFocus,
      lowestCategories,
      highestCategory,
      sampledMissions,
      completedMissionIds: state.completedMissionIds,
      variance
    });

    return {
      lowestCategories,
      minValue,
      variance,
      flags,
      recommendedFocus,
      remediationMissions
    };
  }

  function pickRemediationMissions({ recommendedFocus, lowestCategories, highestCategory, sampledMissions, completedMissionIds, variance }) {
    const remaining = sampledMissions.filter(mission => !completedMissionIds.includes(mission.id));

    const scored = remaining.map(mission => {
      const tags = mission.pedagogy?.tags || [];
      const reinforces = mission.pedagogy?.reinforces || [];
      const avg = buildMissionInsights(mission);
      let score = 0;
      if (tags.includes('remediation')) score += 4;
      if (recommendedFocus !== 'Balance' && reinforces.includes(recommendedFocus)) score += 5;
      lowestCategories.forEach(cat => {
        if (reinforces.includes(cat)) score += 2;
      });
      if (variance > 2 && avg[highestCategory] <= 0) score += 2;
      if (variance > 2 && lowestCategories.some(cat => (avg[cat] || 0) > 0)) score += 3;
      return { id: mission.id, score };
    }).sort((a, b) => b.score - a.score);

    return scored.slice(0, 2).map(item => item.id);
  }

  function rankMissionForState(mission, state, constants) {
    const diagnosis = buildDiagnosis(state, [mission], constants);
    const reinforces = mission.pedagogy?.reinforces || [];
    const tags = mission.pedagogy?.tags || [];
    let score = 0;

    if ((mission.prerequisites?.minDecisions || 0) > state.decisionCount) score -= 5;
    diagnosis.lowestCategories.forEach(cat => {
      if (reinforces.includes(cat)) score += 4;
    });
    if (diagnosis.variance > constants.vMaxVarianceTop && tags.includes('variance-control')) score += 3;
    if (tags.includes('remediation')) score += 2;
    if ((mission.pedagogy?.difficulty || '') === 'hard') score -= 1;
    score += Math.max(0, 3 - Math.abs(state.completedMissionIds.length - (mission.prerequisites?.minDecisions || 0)));
    return score;
  }

  function violatesVariety(selected, candidate) {
    const len = selected.length;
    if (len >= 2) {
      const prev1 = selected[len - 1];
      const prev2 = selected[len - 2];
      if (prev1.hub === candidate.hub && prev2.hub === candidate.hub) return true;
    }
    if (len >= 1) {
      const prev = selected[len - 1];
      if (prev.issueType === candidate.issueType) return true;
    }
    return false;
  }

  function weightedPick(candidates, rng, randomnessWeight) {
    if (!candidates.length) return null;
    const width = Math.max(1, Math.min(candidates.length, 1 + Math.round(randomnessWeight * 8)));
    const topWindow = candidates.slice(0, width);
    const idx = Math.floor(rng() * topWindow.length);
    return topWindow[idx];
  }

  function sampleMissionsForRun(missions, state, constants, config = RUN_CONFIG, explicitSeed) {
    const seed = explicitSeed ?? getRunSeed(config.RANDOMNESS_SEED_MODE);
    const rng = mulberry32(Number(seed) || hashString(String(seed)));

    const withScores = missions.map(mission => ({
      mission,
      score: rankMissionForState(mission, state, constants)
    })).sort((a, b) => b.score - a.score);

    const selected = [];
    const selectedIds = new Set();

    function addMission(candidate) {
      if (!candidate || selectedIds.has(candidate.id)) return false;
      if (violatesVariety(selected, candidate)) return false;
      selected.push(candidate);
      selectedIds.add(candidate.id);
      return true;
    }

    withScores.slice(0, config.RECOMMENDED_COUNT).forEach(({ mission }) => {
      if (!addMission(mission)) {
        const fallback = missions.find(m => !selectedIds.has(m.id));
        if (fallback) addMission(fallback);
      }
    });

    const challengePool = withScores.filter(({ mission }) => (mission.pedagogy?.difficulty || '') === 'hard' && !selectedIds.has(mission.id));
    for (let i = 0; i < config.CHALLENGE_COUNT; i += 1) {
      const picked = weightedPick(challengePool, rng, config.RANDOMNESS_WEIGHT);
      if (picked) addMission(picked.mission);
    }

    const wildcardPool = withScores.filter(({ mission, score }) => !selectedIds.has(mission.id) && score >= -2);
    for (let i = 0; i < config.WILDCARD_COUNT; i += 1) {
      const picked = weightedPick(wildcardPool, rng, 1);
      if (picked) addMission(picked.mission);
    }

    while (selected.length < config.RUN_LENGTH) {
      const remaining = withScores.filter(({ mission }) => !selectedIds.has(mission.id));
      const valid = remaining.filter(({ mission }) => !violatesVariety(selected, mission));
      const pool = valid.length ? valid : remaining;
      const picked = weightedPick(pool, rng, config.RANDOMNESS_WEIGHT);
      if (!picked) break;
      addMission(picked.mission);
    }

    return {
      sampledMissionIds: selected.slice(0, config.RUN_LENGTH).map(mission => mission.id),
      runSeed: seed
    };
  }

  function buildSamplingExplanation(state, diagnosis) {
    const weakest = diagnosis.lowestCategories.join(', ');
    const bullets = [
      `Weakest category right now: ${weakest} (${diagnosis.minValue}).`,
      'Tourism Sampling only serves a subset of cases each run so you rehearse realistic uncertainty and replay different combinations next time.'
    ];

    if (diagnosis.variance > 2) {
      bullets.push(`Your variance is ${diagnosis.variance}, so the run includes balancing cases to reduce spread.`);
    }

    if (diagnosis.flags.length) {
      bullets.push(`Pitfalls detected: ${diagnosis.flags.join(', ')}.`);
    }

    const logic = [
      `Selected ${RUN_CONFIG.RECOMMENDED_COUNT} recommendation-focused cases aligned to your weakest areas.`,
      `Included ${RUN_CONFIG.CHALLENGE_COUNT} challenge case and ${RUN_CONFIG.WILDCARD_COUNT} wildcard for replayability.`,
      'Guardrails avoid same-hub triple streaks and repeated issue tags back-to-back when possible.'
    ];

    return {
      bullets,
      logic
    };
  }

  window.TE9000Adaptation = {
    RUN_CONFIG,
    getRunSeed,
    createRunId,
    mulberry32,
    sampleMissionsForRun,
    buildDiagnosis,
    buildSamplingExplanation,
    computePitfallFlags
  };
})();
