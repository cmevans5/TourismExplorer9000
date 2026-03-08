(function () {
  const STORAGE_KEY = 'tourismExplorer9000State';

  const initialState = {
    categories: {
      economic: 0,
      sustainability: 0,
      culture: 0,
      hospitality: 0,
      satisfaction: 0
    },
    decisionCount: 0,
    correctCount: 0,
    poorStreak: 0,
    pipEnabled: false,
    hotspotPlayedCount: 0,
    runId: null,
    runSeed: null,
    casesCompletedThisRun: 0,
    offerSetMissionIds: [],
    offerSetRolesById: {},
    offerSetReasonsById: {},
    completedMissionIds: [],
    selectedMissionId: null,
    lastMissionId: null,
    lastMissionTags: [],
    lastChosenHub: null,
    lastChosenIssueType: null,
    pipForceOpen: false,
    pipVoluntaryIndicator: false,
    pipWhyExpanded: false,
    highlightMissionIds: [],
    diagnosis: null,
    missionById: {},
    missionOrder: [],
    missionSpendById: {},
    decisionShuffleByMissionId: {},
    decisionLabelSelectionCounts: {},
    decisionHistory: [],
    patternGamingNudgeShownThisRun: false,
    showPatternGamingNudge: false,
    lastDecisionDeltas: null,
    impactPointsRemaining: 0,
    impactPointsSpent: 0,
    BII: 0,
    minCategory: 0,
    variance: 0,
    topGatePassed: false,
    topGateLockReason: '',
    ratingBand: 'At Risk',
    finalNarrative: '',
    currentScreen: 'map'
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(initialState);
    try {
      const parsed = JSON.parse(raw);
      return {
        ...clone(initialState),
        ...parsed,
        categories: { ...clone(initialState).categories, ...(parsed.categories || {}) }
      };
    } catch (error) {
      console.warn('State load failed, resetting.', error);
      return clone(initialState);
    }
  }

  function clearState() {
    localStorage.removeItem(STORAGE_KEY);
    return clone(initialState);
  }

  window.TE9000State = {
    STORAGE_KEY,
    initialState,
    saveState,
    loadState,
    clearState,
    clone
  };
})();
