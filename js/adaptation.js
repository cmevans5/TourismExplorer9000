(function () {
  const RUN_CONFIG = {
    RUN_LENGTH: 8,
    RECOMMENDED_COUNT: 2,
    CHALLENGE_COUNT: 1,
    WILDCARD_COUNT: 1,
    RANDOMNESS_SEED_MODE: 'run',
    RANDOMNESS_WEIGHT: 0.2
  };

  function hashString(value) {
    let h = 2166136261;
    const text = String(value);
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
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

  function createRunRng(runSeed) {
    return mulberry32(hashString(runSeed));
  }

  function buildMissionInsights(mission) {
    if (mission && mission._avgDeltas) {
      return mission._avgDeltas;
    }
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

    const avgOtherForCulture = (state.categories.economic + state.categories.sustainability + state.categories.hospitality + state.categories.satisfaction) / 4;
    if (state.categories.culture + 1 < avgOtherForCulture) flags.push('NeglectCulture');

    const avgOtherForSustain = (state.categories.economic + state.categories.culture + state.categories.hospitality + state.categories.satisfaction) / 4;
    if (state.categories.sustainability + 1 < avgOtherForSustain) flags.push('NeglectSustain');

    if (state.categories.economic - avgOtherForCulture >= 4) flags.push('EconomicOverIndex');

    const decisions = Math.max(1, state.decisionCount || 0);
    const spendPerDecision = (state.impactPointsSpent || 0) / decisions;
    if (spendPerDecision > 70 && state.BII < 60) flags.push('BudgetInefficient');

    return flags;
  }

  function deriveNeeds(state, constants) {
    const entries = Object.entries(state.categories).sort((a, b) => a[1] - b[1]);
    const minValue = entries[0][1];
    const maxValue = entries[entries.length - 1][1];
    const lowestCategories = entries.filter(([, value]) => value === minValue).map(([key]) => key);

    return {
      lowestCategory: lowestCategories[0],
      lowestCategories,
      secondaryNeed: entries[1][0],
      highestCategory: entries[entries.length - 1][0],
      variance: maxValue - minValue,
      flags: computePitfallFlags(state, constants),
      minValue
    };
  }

  function roleLabel(role) {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  function evaluateMissionForNeed(mission, needs) {
    const reinforces = mission.pedagogy?.reinforces || [];
    const avg = buildMissionInsights(mission);
    const difficulty = mission.pedagogy?.difficulty || 'medium';

    let recommendedScore = 0;
    let challengeScore = 0;
    let wildcardScore = 0;
    const reasons = [];

    needs.lowestCategories.forEach(category => {
      if (reinforces.includes(category)) {
        recommendedScore += 6;
        challengeScore += 2;
        reasons.push(`Supports low ${category} outcomes.`);
      }
      if ((avg[category] || 0) > 0) {
        recommendedScore += 3;
        reasons.push(`Average options can lift ${category}.`);
      }
    });

    if (needs.flags.includes('HighVariance') && (avg[needs.highestCategory] || 0) <= 0) {
      recommendedScore += 4;
      reasons.push('Helps reduce current variance pressure.');
    }

    if (reinforces.includes(needs.secondaryNeed)) {
      challengeScore += 4;
      reasons.push(`Builds transfer on secondary need (${needs.secondaryNeed}).`);
    }

    if (difficulty === 'hard') {
      challengeScore += 4;
      reasons.push('Higher difficulty challenge for transfer practice.');
    }

    wildcardScore += 2;
    if ((avg[needs.lowestCategory] || 0) >= 0) {
      wildcardScore += 2;
      reasons.push('Wildcard should not deepen your weakest category.');
    } else {
      wildcardScore -= 3;
    }

    return {
      recommendedScore,
      challengeScore,
      wildcardScore,
      reasons: reasons.slice(0, 3)
    };
  }

  function applySelectionConstraints(selectedMissions, candidate, state) {
    const hubCounts = selectedMissions.reduce((acc, mission) => {
      acc[mission.hub] = (acc[mission.hub] || 0) + 1;
      return acc;
    }, {});

    if ((hubCounts[candidate.hub] || 0) >= 2) {
      return { valid: false, reason: 'hub-cap' };
    }

    if (state.lastChosenHub && candidate.hub === state.lastChosenHub) {
      const alternatives = selectedMissions.some(mission => mission.hub !== state.lastChosenHub);
      if (alternatives) return { valid: false, reason: 'repeat-last-hub' };
    }

    const issueCounts = selectedMissions.reduce((acc, mission) => {
      acc[mission.issueType] = (acc[mission.issueType] || 0) + 1;
      return acc;
    }, {});

    if ((issueCounts[candidate.issueType] || 0) >= 2) {
      return { valid: false, reason: 'issue-variety' };
    }

    return { valid: true };
  }

  function pickWithRandomness(scoredCandidates, rng, randomnessWeight) {
    if (!scoredCandidates.length) return null;
    const top = scoredCandidates[0];
    const nearTop = scoredCandidates.filter(item => item.score >= top.score - 2);
    if (nearTop.length > 1 && rng() < randomnessWeight) {
      return nearTop[Math.floor(rng() * nearTop.length)];
    }
    return top;
  }

  function selectMissionForRole(role, pools, selectedMissions, selectedIds, state, rng, randomnessWeight) {
    const ranked = pools
      .filter(item => !selectedIds.has(item.mission.id))
      .sort((a, b) => b[`${role}Score`] - a[`${role}Score`]);

    const strict = ranked.filter(item => applySelectionConstraints(selectedMissions, item.mission, state).valid);
    const relaxed = strict.length ? strict : ranked;
    const picked = pickWithRandomness(relaxed.map(item => ({ ...item, score: item[`${role}Score`] })), rng, randomnessWeight);
    return picked ? picked.mission : null;
  }

  function generateOfferSet(missions, state, constants, runConfig = RUN_CONFIG, rng) {
    const completed = new Set(state.completedMissionIds || []);
    const available = missions.filter(mission => !completed.has(mission.id));
    const needs = deriveNeeds(state, constants);
    const localRng = rng || createRunRng(`${state.runSeed || 'default'}:${state.casesCompletedThisRun || 0}`);

    const scored = available.map(mission => {
      const evaluated = evaluateMissionForNeed(mission, needs);
      return {
        mission,
        ...evaluated
      };
    });

    const selected = [];
    const selectedIds = new Set();
    const rolesById = {};
    const reasonsById = {};

    function addMission(mission, role) {
      if (!mission || selectedIds.has(mission.id)) return;
      selected.push(mission);
      selectedIds.add(mission.id);
      rolesById[mission.id] = role;
      const missionEval = scored.find(item => item.mission.id === mission.id);
      reasonsById[mission.id] = missionEval?.reasons?.length
        ? missionEval.reasons
        : [`${roleLabel(role)} mission selected to maintain adaptive variety.`];
    }

    for (let i = 0; i < runConfig.RECOMMENDED_COUNT; i += 1) {
      addMission(selectMissionForRole('recommended', scored, selected, selectedIds, state, localRng, runConfig.RANDOMNESS_WEIGHT), 'recommended');
    }
    addMission(selectMissionForRole('challenge', scored, selected, selectedIds, state, localRng, runConfig.RANDOMNESS_WEIGHT), 'challenge');
    addMission(selectMissionForRole('wildcard', scored, selected, selectedIds, state, localRng, runConfig.RANDOMNESS_WEIGHT), 'wildcard');

    while (selected.length < 4) {
      const fallback = available.find(mission => !selectedIds.has(mission.id));
      if (!fallback) break;
      addMission(fallback, 'wildcard');
    }

    return {
      offerMissionIds: selected.slice(0, 4).map(mission => mission.id),
      rolesById,
      reasonsById,
      needs
    };
  }

  function pickRemediationMissions(state, offerSet) {
    const ids = offerSet.offerMissionIds || [];
    const recommended = ids.filter(id => offerSet.rolesById[id] === 'recommended');
    if (recommended.length >= 2) return recommended.slice(0, 2);

    const challenge = ids.find(id => offerSet.rolesById[id] === 'challenge');
    if (challenge) recommended.push(challenge);
    return recommended.slice(0, 2);
  }

  function buildDiagnosis(state, constants, offerSet) {
    const needs = deriveNeeds(state, constants);
    return {
      ...needs,
      recommendedFocus: needs.lowestCategory || 'Balance',
      remediationMissions: offerSet ? pickRemediationMissions(state, offerSet) : []
    };
  }

  function buildOfferSetExplanation(state, offerSet, missionsById) {
    const needs = offerSet.needs || {
      lowestCategory: 'economic',
      lowestCategories: ['economic'],
      variance: 0,
      flags: []
    };

    const summaryBullets = [
      `Lowest category right now: ${needs.lowestCategories.join(', ')} (${needs.minValue ?? state.minCategory ?? 0}).`,
      `Current variance is ${needs.variance}.`,
      `Pitfall flags: ${needs.flags.length ? needs.flags.join(', ') : 'none detected'}.`
    ];

    const perMissionBullets = {};
    (offerSet.offerMissionIds || []).forEach(missionId => {
      const mission = missionsById[missionId];
      const role = offerSet.rolesById[missionId] || 'wildcard';
      const reasons = offerSet.reasonsById[missionId] || [];
      perMissionBullets[missionId] = [
        `${roleLabel(role)}: ${mission?.name || missionId}.`,
        ...reasons
      ];
    });

    return {
      summaryBullets,
      perMissionBullets
    };
  }

  window.TE9000Adaptation = {
    RUN_CONFIG,
    getRunSeed,
    createRunId,
    mulberry32,
    createRunRng,
    generateOfferSet,
    buildOfferSetExplanation,
    buildDiagnosis,
    computePitfallFlags,
    deriveNeeds
  };
})();
