(function () {
  const RUN_CONFIG = {
    RUN_LENGTH: 4,
    RANDOMNESS_SEED_MODE: 'run',
    CURATED_SEQUENCE: [
      'riverwalk-mobility-surge',
      'ybor-nightlife-balance',
      'port-cruise-dispersal',
      'busch-pricing-fatigue'
    ]
  };

  function hashString(value) {
    let h = 2166136261;
    const text = String(value || '');
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function getRunSeed(seedMode = RUN_CONFIG.RANDOMNESS_SEED_MODE) {
    if (seedMode === 'daily') {
      const now = new Date();
      return hashString(`${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`);
    }
    return hashString(`${Date.now()}-${Math.random()}`);
  }

  function createRunId(seed) {
    return `academic-${Date.now()}-${seed}`;
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

  function createRunRng(seedInput) {
    return mulberry32(hashString(seedInput));
  }

  function computePitfallFlags(state, constants) {
    const categories = state.categories || {};
    const values = Object.values(categories);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const flags = [];

    if (max - min > constants.vMaxVarianceTop + 1) flags.push('Portfolio imbalance');
    if (categories.culture < 0) flags.push('Resident trust pressure');
    if (categories.sustainability < 0) flags.push('Sustainability strain');
    if (categories.hospitality < 0 || categories.satisfaction < 0) flags.push('Visitor experience risk');
    if ((state.learningScore || 0) < Math.max(1, state.decisionCount || 0)) flags.push('Reasoning evidence is thin');

    return flags;
  }

  function deriveNeeds(state, constants) {
    const entries = Object.entries(state.categories || {}).sort((left, right) => left[1] - right[1]);
    const minValue = entries[0]?.[1] ?? 0;
    const maxValue = entries[entries.length - 1]?.[1] ?? 0;
    const lowestCategories = entries.filter(([, value]) => value === minValue).map(([key]) => key);

    return {
      lowestCategory: lowestCategories[0] || 'sustainability',
      lowestCategories,
      highestCategory: entries[entries.length - 1]?.[0] || 'economic',
      variance: maxValue - minValue,
      minValue,
      flags: computePitfallFlags(state, constants)
    };
  }

  function sortByCuratedSequence(missions) {
    const order = new Map(RUN_CONFIG.CURATED_SEQUENCE.map((id, index) => [id, index]));
    return missions.slice().sort((left, right) => {
      const leftOrder = order.has(left.id) ? order.get(left.id) : Number.MAX_SAFE_INTEGER;
      const rightOrder = order.has(right.id) ? order.get(right.id) : Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder;
    });
  }

  function generateOfferSet(missions, state, constants) {
    const completed = new Set(state.completedMissionIds || []);
    const ordered = sortByCuratedSequence(missions);
    const available = ordered.filter((mission) => !completed.has(mission.id)).slice(0, RUN_CONFIG.RUN_LENGTH);
    const rolesById = {};
    const reasonsById = {};

    available.forEach((mission, index) => {
      rolesById[mission.id] = index === 0 ? 'current' : (index === 1 ? 'next' : 'later');
      reasonsById[mission.id] = [
        mission.tourismDomain,
        mission.learningObjectives?.[0] || 'Practice tourism systems reasoning.',
        mission.constraints?.[0] || 'Balance destination outcomes and stakeholder needs.'
      ].filter(Boolean);
    });

    return {
      offerMissionIds: available.map((mission) => mission.id),
      rolesById,
      reasonsById,
      needs: deriveNeeds(state, constants)
    };
  }

  function buildDiagnosis(state, constants, offerSet) {
    const needs = deriveNeeds(state, constants);
    const currentMissionId = offerSet?.offerMissionIds?.[0] || null;
    return {
      ...needs,
      recommendedFocus: needs.lowestCategory,
      remediationMissions: currentMissionId ? [currentMissionId] : []
    };
  }

  function buildOfferSetExplanation(state, offerSet, missionsById) {
    const needs = offerSet?.needs || deriveNeeds(state, window.TE9000Scoring?.SCORING_CONSTANTS || {});
    const summaryBullets = [
      `Weakest destination indicator: ${needs.lowestCategories.join(', ') || 'none yet'} (${needs.minValue ?? 0}).`,
      `Current balance spread: ${needs.variance}.`,
      `Learning coach focus: strengthen evidence use and explain trade-offs across stakeholders.`
    ];

    const perMissionBullets = {};
    (offerSet?.offerMissionIds || []).forEach((missionId, index) => {
      const mission = missionsById[missionId];
      perMissionBullets[missionId] = [
        index === 0 ? 'This is the next curated classroom case.' : 'This case stays in the queue for later discussion.',
        mission?.learningObjectives?.[0] || 'Practice evidence-based tourism analysis.',
        mission?.constraints?.[0] || 'Monitor the destination trade-off before selecting a strategy.'
      ];
    });

    return { summaryBullets, perMissionBullets };
  }

  window.TE9000Adaptation = {
    RUN_CONFIG,
    getRunSeed,
    createRunId,
    createRunRng,
    generateOfferSet,
    buildDiagnosis,
    buildOfferSetExplanation,
    computePitfallFlags,
    deriveNeeds
  };
})();
