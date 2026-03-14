(function () {
<<<<<<< HEAD
  const STORAGE_KEY = 'tourismExplorer9000AcademicState';
=======
  const STORAGE_KEY = 'tourismExplorer9000State';
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c

  const initialState = {
    categories: {
      economic: 0,
      sustainability: 0,
      culture: 0,
      hospitality: 0,
      satisfaction: 0
    },
<<<<<<< HEAD
    currentScreen: 'map',
    runId: null,
    runSeed: null,
    casesCompletedThisRun: 0,
    completedMissionIds: [],
    offerSetMissionIds: [],
    offerSetRolesById: {},
    offerSetReasonsById: {},
    suggestedMissionId: null,
    selectedMissionId: null,
    selectedHotspotId: null,
    lastMissionId: null,
    lastChosenHub: null,
    lastChosenIssueType: null,
    lastDecisionDeltas: null,
    lastDecisionOutcomeText: '',
    turnGoal: '',
    riskTrend: 'steady',
    poorStreak: 0,
    pipEnabled: false,
=======
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
    selectedHotspotId: null,
    lastMissionId: null,
    lastMissionTags: [],
    lastChosenHub: null,
    lastChosenIssueType: null,
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
    pipForceOpen: false,
    pipVoluntaryIndicator: false,
    pipWhyExpanded: false,
    highlightMissionIds: [],
    diagnosis: null,
<<<<<<< HEAD
    decisionCount: 0,
    correctCount: 0,
=======
    missionById: {},
    missionOrder: [],
    missionSpendById: {},
    decisionShuffleByMissionId: {},
    decisionLabelSelectionCounts: {},
    decisionHistory: [],
    patternGamingNudgeShownThisRun: false,
    showPatternGamingNudge: false,
    lastDecisionDeltas: null,
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
    impactPointsRemaining: 0,
    impactPointsSpent: 0,
    BII: 0,
    minCategory: 0,
    variance: 0,
    topGatePassed: false,
    topGateLockReason: '',
    ratingBand: 'At Risk',
    finalNarrative: '',
<<<<<<< HEAD
    decisionShuffleByMissionId: {},
    decisionHistory: [],
    learningScore: 0,
    learningEvidenceUsedCount: 0,
    rationaleDraftsByMissionId: {},
    rationaleRecords: [],
    currentFeedback: null,
    reflectionResponses: {
      optimizedPriority: '',
      benefitedStakeholder: '',
      revisitTradeoff: ''
    },
    reflectionSubmitted: false,
    mapOnboardingDismissed: false
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
=======
    currentScreen: 'map',
    mapOnboardingDismissed: false
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(initialState);
<<<<<<< HEAD

=======
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
    try {
      const parsed = JSON.parse(raw);
      return {
        ...clone(initialState),
        ...parsed,
<<<<<<< HEAD
        categories: {
          ...clone(initialState).categories,
          ...(parsed.categories || {})
        },
        reflectionResponses: {
          ...clone(initialState).reflectionResponses,
          ...(parsed.reflectionResponses || {})
        },
        rationaleDraftsByMissionId: {
          ...(parsed.rationaleDraftsByMissionId || {})
        }
=======
        categories: { ...clone(initialState).categories, ...(parsed.categories || {}) }
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
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
<<<<<<< HEAD
    clone,
    saveState,
    loadState,
    clearState
=======
    saveState,
    loadState,
    clearState,
    clone
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
  };
})();
