(function () {
  const STORAGE_KEY = 'tourismExplorer9000AcademicState';

  const initialState = {
    categories: {
      economic: 0,
      sustainability: 0,
      culture: 0,
      hospitality: 0,
      satisfaction: 0
    },
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
    pipForceOpen: false,
    pipVoluntaryIndicator: false,
    pipWhyExpanded: false,
    highlightMissionIds: [],
    diagnosis: null,
    decisionCount: 0,
    correctCount: 0,
    impactPointsRemaining: 0,
    impactPointsSpent: 0,
    BII: 0,
    minCategory: 0,
    variance: 0,
    topGatePassed: false,
    topGateLockReason: '',
    ratingBand: 'At Risk',
    finalNarrative: '',
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
    clone,
    saveState,
    loadState,
    clearState
  };
})();
