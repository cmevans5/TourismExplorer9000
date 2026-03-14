(function () {
  const mainEl = document.getElementById('mainContent');
  const dashboardPanel = document.getElementById('dashboardPanel');
  const dashboardContent = document.getElementById('dashboardContent');
  const pipOverlay = document.getElementById('pipOverlay');
  const pipPanelContent = document.getElementById('pipPanelContent');

  const {
    SCORING_CONSTANTS,
    computeBII,
    computeVariance,
    canAffordDecision,
    checkTopGate,
    classifyRating
  } = window.TE9000Scoring;
  const { saveState, loadState, clearState } = window.TE9000State;
  const {
    RUN_CONFIG,
    getRunSeed,
    createRunId,
    createRunRng,
    generateOfferSet,
<<<<<<< HEAD
    buildDiagnosis,
    buildOfferSetExplanation
=======
    buildOfferSetExplanation,
    buildDiagnosis
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
  } = window.TE9000Adaptation;
  const { validateMissions } = window.TE9000MissionValidation;
  const UI = window.TE9000UI;

  const CATEGORY_LABELS = {
<<<<<<< HEAD
    economic: 'Destination Economics',
    sustainability: 'Environmental Sustainability',
    culture: 'Community and Cultural Stewardship',
    hospitality: 'Hospitality and Service Quality',
    satisfaction: 'Visitor Experience'
  };
=======
    economic: 'Economic Capital',
    sustainability: 'Sustainability',
    culture: 'Cultural Inclusion',
    hospitality: 'Hospitality',
    satisfaction: 'Visitor Satisfaction'
  };
  const PRESENTATION_LABEL_REPEAT_THRESHOLD = 3;
  const DISTRICT_STORYBOARD_ORDER = [
    'downtown-waterfront',
    'cultural-corridor',
    'historic-ybor',
    'eco-park',
    'beachfront-zone'
  ];
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c

  let state = loadState();
  let missions = [];
  let missionById = {};
  let optionsByMissionId = {};
<<<<<<< HEAD
  let pendingReturnMissionId = null;
  let lastFocusedEl = null;
=======
  let lastFocusedEl = null;
  let pendingReturnMissionId = null;
  let lastRenderedMapHotspotId = null;
  let pendingCtaFocusMissionId = null;

  function clearDecisionDeltaIndicatorsOnSceneChange(draft, nextScreen) {
    if (nextScreen === 'decision') {
      draft.lastDecisionDeltas = null;
      draft.lastDecisionOutcomeText = '';
      return;
    }

    const isMajorSceneChange = draft.currentScreen !== nextScreen;
    const hasTransientDeltas = Boolean(draft.lastDecisionDeltas);
    const leavingDecisionScreen = draft.currentScreen === 'decision';

    if (isMajorSceneChange && hasTransientDeltas && !leavingDecisionScreen) {
      draft.lastDecisionDeltas = null;
      draft.lastDecisionOutcomeText = '';
    }
  }
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c

  function commit(mutator, { renderAfter = true, recomputeMetrics = false } = {}) {
    mutator(state);
    if (recomputeMetrics) computeAndStoreMetrics();
    saveState(state);
    if (renderAfter) render();
  }

<<<<<<< HEAD
  function currentMission() {
    return missionById[state.selectedMissionId] || null;
=======
  function getOfferedMissions() {
    return (state.offerSetMissionIds || []).map(id => missionById[id]).filter(Boolean);
  }

  function getSuggestedMissionId(offerMissionIds = state.offerSetMissionIds || []) {
    if (!offerMissionIds.length) return null;

    const recommended = offerMissionIds.filter(id => state.offerSetRolesById?.[id] === 'recommended');
    const candidateIds = recommended.length ? recommended : offerMissionIds;
    const diagnosisIds = state.diagnosis?.remediationMissions || [];
    const diagnosisMatch = diagnosisIds.find(id => candidateIds.includes(id));
    if (diagnosisMatch) return diagnosisMatch;
    return candidateIds[0];
  }

  function refreshTurnHeaderSignals() {
    const goalByNeed = {
      economic: 'Strengthen Economic Capital while protecting visitor experience.',
      sustainability: 'Reduce emissions and strain while keeping service delivery reliable.',
      culture: 'Improve Cultural Inclusion without destabilizing other categories.',
      hospitality: 'Raise Hospitality through practical operations improvements.',
      satisfaction: 'Boost Visitor Satisfaction while preserving long-term system balance.'
    };
    const orderedCategories = Object.entries(state.categories || {}).sort((left, right) => left[1] - right[1]);
    const weakestCategory = orderedCategories[0]?.[0] || 'satisfaction';

    state.turnGoal = goalByNeed[weakestCategory] || 'Pick a mission that stabilizes your weakest category first.';

    const netDelta = Object.values(state.lastDecisionDeltas || {}).reduce((sum, value) => sum + value, 0);
    state.riskTrend = netDelta < 0 ? 'up' : (netDelta > 0 ? 'down' : 'steady');
  }

  function currentMission() {
    return state.selectedMissionId ? missionById[state.selectedMissionId] : null;
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
  }

  function runCompleted() {
    return state.casesCompletedThisRun >= RUN_CONFIG.RUN_LENGTH;
  }

<<<<<<< HEAD
  function getOfferedMissions() {
    return (state.offerSetMissionIds || []).map((id) => missionById[id]).filter(Boolean);
  }

  function summarizeFinalNarrative() {
    const strongest = Object.entries(state.categories).sort((left, right) => right[1] - left[1])[0];
    const weakest = Object.entries(state.categories).sort((left, right) => left[1] - right[1])[0];
    return `Your strategy most improved ${CATEGORY_LABELS[strongest?.[0]] || 'destination performance'} while ${CATEGORY_LABELS[weakest?.[0]] || 'one area'} remained the weakest part of the portfolio.`;
  }

  function refreshTurnHeaderSignals() {
    const weakest = Object.entries(state.categories).sort((left, right) => left[1] - right[1])[0]?.[0] || 'satisfaction';
    const goals = {
      economic: 'Protect destination value without sacrificing trust.',
      sustainability: 'Reduce system strain while keeping access reliable.',
      culture: 'Support community legitimacy and place identity.',
      hospitality: 'Strengthen service quality through practical operations.',
      satisfaction: 'Improve the visitor experience without externalizing the cost.'
    };
    state.turnGoal = goals[weakest];
    const netDelta = Object.values(state.lastDecisionDeltas || {}).reduce((sum, value) => sum + value, 0);
    state.riskTrend = netDelta < 0 ? 'up' : (netDelta > 0 ? 'down' : 'steady');
=======
  function getFinalNarrative() {
    const sorted = Object.entries(state.categories).sort((a, b) => b[1] - a[1]);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];
    const hi = CATEGORY_LABELS[strongest[0]];
    const lo = CATEGORY_LABELS[weakest[0]];

    if (state.BII >= 75 && state.topGatePassed) return `Your strategy produced a resilient tourism portfolio with strong ${hi} while keeping system trade-offs under control.`;
    if (state.variance > SCORING_CONSTANTS.vMaxVarianceTop) return `Your strategy strengthened ${hi}, but large imbalances left ${lo} under-supported. The next cycle should rebalance system pressures.`;
    return `Your strategy improved ${hi}, but ${lo} lagged behind. Reallocate future Impact Points toward cross-category resilience.`;
  }

  function refreshOfferSet() {
    if (runCompleted()) {
      state.offerSetMissionIds = [];
      state.offerSetRolesById = {};
      state.offerSetReasonsById = {};
      state.suggestedMissionId = null;
      state.selectedHotspotId = null;
      state.diagnosis = buildDiagnosis(state, SCORING_CONSTANTS, { offerMissionIds: [], rolesById: {}, reasonsById: {}, needs: null });
      return;
    }

    const seedInput = `${state.runSeed}:${state.casesCompletedThisRun}:${(state.completedMissionIds || []).join(',')}`;
    const offer = generateOfferSet(missions, state, SCORING_CONSTANTS, RUN_CONFIG, createRunRng(seedInput));
    const orderRng = createRunRng(`${state.runSeed}:${state.casesCompletedThisRun}:offer-order`);
    const shuffledOfferMissionIds = (offer.offerMissionIds || []).slice();
    for (let i = shuffledOfferMissionIds.length - 1; i > 0; i -= 1) {
      const j = Math.floor(orderRng() * (i + 1));
      [shuffledOfferMissionIds[i], shuffledOfferMissionIds[j]] = [shuffledOfferMissionIds[j], shuffledOfferMissionIds[i]];
    }

    state.offerSetMissionIds = shuffledOfferMissionIds;
    state.offerSetRolesById = offer.rolesById;
    state.offerSetReasonsById = offer.reasonsById;
    state.suggestedMissionId = getSuggestedMissionId(shuffledOfferMissionIds);
    state.selectedHotspotId = shuffledOfferMissionIds.includes(state.selectedHotspotId)
      ? state.selectedHotspotId
      : (shuffledOfferMissionIds[0] || null);
    state.diagnosis = buildDiagnosis(state, SCORING_CONSTANTS, offer);
  }

  function initializeRun(forceNew) {
    if (!missions.length) return;
    const missingOfferSet = !Array.isArray(state.offerSetMissionIds) || state.offerSetMissionIds.length !== 4;
    if (forceNew || !state.runSeed || missingOfferSet || runCompleted()) {
      state.runSeed = getRunSeed(RUN_CONFIG.RANDOMNESS_SEED_MODE);
      state.runId = createRunId(state.runSeed);
      state.completedMissionIds = [];
      state.offerSetMissionIds = [];
      state.offerSetRolesById = {};
      state.offerSetReasonsById = {};
      state.suggestedMissionId = null;
      state.selectedHotspotId = null;
      state.casesCompletedThisRun = 0;
      state.selectedMissionId = null;
      state.lastMissionId = null;
      state.lastMissionTags = [];
      state.lastChosenHub = null;
      state.lastChosenIssueType = null;
      state.highlightMissionIds = [];
      state.poorStreak = 0;
      state.pipEnabled = false;
      state.pipForceOpen = false;
      state.pipVoluntaryIndicator = false;
      state.pipWhyExpanded = false;
      state.decisionCount = 0;
      state.correctCount = 0;
      state.hotspotPlayedCount = 0;
      state.impactPointsRemaining = 0;
      state.impactPointsSpent = 0;
      state.categories = { economic: 0, sustainability: 0, culture: 0, hospitality: 0, satisfaction: 0 };
      state.missionSpendById = {};
      state.decisionShuffleByMissionId = {};
      state.decisionLabelSelectionCounts = {};
      state.decisionHistory = [];
      state.patternGamingNudgeShownThisRun = false;
      state.showPatternGamingNudge = false;
      state.lastDecisionDeltas = null;
      state.lastDecisionOutcomeText = '';
      state.turnGoal = '';
      state.riskTrend = 'steady';
    }

    computeAndStoreMetrics();
    refreshOfferSet();
    refreshTurnHeaderSignals();
  }

  function navigate(screen) {
    commit(draft => {
      clearDecisionDeltaIndicatorsOnSceneChange(draft, screen);
      draft.currentScreen = screen;
    });
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
  }

  function computeAndStoreMetrics() {
    const result = computeBII(
      state.categories,
      { remainingImpactPoints: state.impactPointsRemaining, totalSpent: state.impactPointsSpent },
      SCORING_CONSTANTS
    );

<<<<<<< HEAD
    state.BII = Math.round(result.BII);
    state.variance = computeVariance(state.categories);
    state.minCategory = Math.min(...Object.values(state.categories));
    state.topGatePassed = checkTopGate(state.categories, state.variance, SCORING_CONSTANTS);
    state.ratingBand = classifyRating(state.BII, state.topGatePassed, SCORING_CONSTANTS);

    if (state.topGatePassed) {
      state.topGateLockReason = '';
    } else if (state.minCategory < SCORING_CONSTANTS.vMinCategoryTop) {
      state.topGateLockReason = `every category must reach at least ${SCORING_CONSTANTS.vMinCategoryTop}`;
    } else if (state.variance > SCORING_CONSTANTS.vMaxVarianceTop) {
      state.topGateLockReason = `variance must stay at ${SCORING_CONSTANTS.vMaxVarianceTop} or below`;
    } else if (Object.values(state.categories).some((value) => value < 0)) {
      state.topGateLockReason = 'no destination indicator can remain negative';
    } else if (state.BII < SCORING_CONSTANTS.ratingThresholds.top) {
      state.topGateLockReason = `Balance Index must reach ${SCORING_CONSTANTS.ratingThresholds.top}`;
    } else {
      state.topGateLockReason = 'one or more top-tier requirements remain unmet';
    }

    state.finalNarrative = summarizeFinalNarrative();
    state.diagnosis = buildDiagnosis(state, SCORING_CONSTANTS, {
      offerMissionIds: state.offerSetMissionIds || []
    });
    state.pipVoluntaryIndicator = state.decisionCount >= 1;
    refreshTurnHeaderSignals();
  }

  function refreshOfferSet() {
    const offer = generateOfferSet(missions, state, SCORING_CONSTANTS, RUN_CONFIG);
    state.offerSetMissionIds = offer.offerMissionIds;
    state.offerSetRolesById = offer.rolesById;
    state.offerSetReasonsById = offer.reasonsById;
    state.suggestedMissionId = offer.offerMissionIds[0] || null;
    if (!offer.offerMissionIds.includes(state.selectedHotspotId)) {
      state.selectedHotspotId = offer.offerMissionIds[0] || null;
    }
    state.diagnosis = buildDiagnosis(state, SCORING_CONSTANTS, offer);
  }

  function initializeRun(forceNew = false) {
    if (!missions.length) return;

    if (forceNew || !state.runId) {
      state = clearState();
      state.runSeed = getRunSeed(RUN_CONFIG.RANDOMNESS_SEED_MODE);
      state.runId = createRunId(state.runSeed);
      state.selectedHotspotId = missions[0]?.id || null;
    }

    computeAndStoreMetrics();
    refreshOfferSet();
    saveState(state);
  }

  function navigate(screen) {
    commit((draft) => {
      draft.currentScreen = screen;
    });
  }

  function selectHotspot(missionId) {
    if (!(state.offerSetMissionIds || []).includes(missionId)) return;
    commit((draft) => {
      draft.selectedHotspotId = missionId;
    });
  }

  function selectMission(missionId) {
    if (!(state.offerSetMissionIds || []).includes(missionId)) return;
    const mission = missionById[missionId];
    if (!mission) return;

    commit((draft) => {
      draft.selectedMissionId = missionId;
      draft.currentScreen = 'explore';
      draft.impactPointsRemaining = SCORING_CONSTANTS.impactBudgetPerHotspot;
      draft.currentFeedback = null;
      draft.lastDecisionDeltas = null;
      draft.lastDecisionOutcomeText = '';
      draft.rationaleDraftsByMissionId = draft.rationaleDraftsByMissionId || {};
      draft.rationaleDraftsByMissionId[missionId] = draft.rationaleDraftsByMissionId[missionId] || {
        stakeholderId: '',
        evidenceId: '',
        tradeoff: ''
      };
    });
  }

  function getDecisionOptionsForMission(mission) {
    if (!mission) return [];
    state.decisionShuffleByMissionId = state.decisionShuffleByMissionId || {};
    let order = state.decisionShuffleByMissionId[mission.id];

    if (!Array.isArray(order) || order.length !== mission.options.length) {
      const ids = mission.options.map((option) => option.id);
      const rng = createRunRng(`${state.runSeed}:${mission.id}:options`);
      for (let index = ids.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(rng() * (index + 1));
        [ids[index], ids[swapIndex]] = [ids[swapIndex], ids[index]];
      }
      order = ids;
      state.decisionShuffleByMissionId[mission.id] = order;
    }

    return order.map((id, index) => ({
      ...optionsByMissionId[mission.id][id],
      originalKey: id,
      displayLabel: String.fromCharCode(65 + index)
    }));
  }

  function buildSystemInsight(mission, deltas, option) {
    const gains = Object.entries(deltas).filter(([, value]) => value > 0).map(([key]) => CATEGORY_LABELS[key]);
    const losses = Object.entries(deltas).filter(([, value]) => value < 0).map(([key]) => CATEGORY_LABELS[key]);
    if (gains.length && losses.length) {
      return `${mission.tourismDomain} shifts improved ${gains.join(', ')}, but added pressure to ${losses.join(', ')}. ${option.coachNote}`;
    }
    if (gains.length) return `${mission.tourismDomain} mostly reinforced ${gains.join(', ')}. ${option.coachNote}`;
    return `${mission.tourismDomain} created strain without visible gains. ${option.coachNote}`;
  }

  function evaluatePoorOutcome(deltas) {
    return Object.values(deltas).reduce((sum, value) => sum + value, 0) < 1;
  }

  function getRationaleDraft(missionId) {
    return state.rationaleDraftsByMissionId?.[missionId] || { stakeholderId: '', evidenceId: '', tradeoff: '' };
  }

  function scoreRationale(mission, draft) {
    const stakeholder = (mission.stakeholders || []).find((item) => item.id === draft.stakeholderId);
    const evidence = (mission.evidence || []).find((item) => item.id === draft.evidenceId);
    const tradeoff = String(draft.tradeoff || '').trim();
    let score = 0;
    if (stakeholder) score += 1;
    if (evidence) score += 1;
    if (tradeoff.length >= 30) score += 1;
    return {
      score,
      stakeholderLabel: stakeholder?.label || '',
      evidenceLabel: evidence?.label || '',
      tradeoff
    };
  }

  function validateRationale(mission, draft) {
    const result = scoreRationale(mission, draft);
    if (!result.stakeholderLabel || !result.evidenceLabel || result.tradeoff.length < 30) {
      window.alert('Before choosing an option, select a stakeholder, cite one evidence point, and write a brief trade-off explanation of at least 30 characters.');
      return null;
    }
    return result;
  }

  function applyDecision(displayLabel) {
    const mission = currentMission();
    if (!mission) return;

    const draft = getRationaleDraft(mission.id);
    const rationale = validateRationale(mission, draft);
    if (!rationale) return;

    const displayOptions = getDecisionOptionsForMission(mission);
    const option = displayOptions.find((item) => item.displayLabel === displayLabel);
    if (!option) return;
    const optionCost = option.cost ?? option.impactCost;
    if (!canAffordDecision(state.impactPointsRemaining, optionCost)) return;

    const deltas = { ...option.deltas };
    const poorOutcome = evaluatePoorOutcome(deltas);
    const feedbackOutcome = String(option.feedback || '').trim();
    const isCorrect = mission.correctOptionId ? mission.correctOptionId === option.id : false;

    commit((draftState) => {
      Object.keys(deltas).forEach((key) => {
        draftState.categories[key] += deltas[key];
      });
      draftState.lastDecisionDeltas = { ...deltas };
      draftState.lastDecisionOutcomeText = feedbackOutcome;
      draftState.impactPointsRemaining -= optionCost;
      draftState.impactPointsSpent += optionCost;
      draftState.decisionCount += 1;
      draftState.learningScore += rationale.score;
      draftState.learningEvidenceUsedCount += 1;
      draftState.poorStreak = poorOutcome ? draftState.poorStreak + 1 : 0;
      draftState.pipEnabled = draftState.poorStreak >= 2;
      if (isCorrect) draftState.correctCount += 1;
      draftState.currentFeedback = {
        text: option.feedback,
        systemInsight: buildSystemInsight(mission, deltas, option),
        learningNote: option.learningNote,
        coachNote: option.coachNote,
        reflectionPrompt: mission.reflectionPrompt,
        deltas,
        stakeholderImpacts: option.stakeholderImpacts,
        rationale,
        rationaleScore: rationale.score
      };
      draftState.decisionHistory.push({
        mission: mission.name,
        selectedOption: option.title,
        impactCost: optionCost,
        deltas,
        rationale,
        rationaleScore: rationale.score,
        feedbackOutcome
      });
    }, { renderAfter: false, recomputeMetrics: true });

    pendingReturnMissionId = mission.id;
    const feedbackHtml = UI.renderFeedback(state.currentFeedback, state);
    document.getElementById('feedbackContainer').innerHTML = feedbackHtml;
    const feedbackCard = document.querySelector('#feedbackContainer section');
    if (feedbackCard) feedbackCard.focus();
  }

  function handleReturnToMap() {
    const missionId = pendingReturnMissionId || state.selectedMissionId;
    const mission = missionById[missionId];
    if (!mission) return;

    commit((draft) => {
      if (!draft.completedMissionIds.includes(mission.id)) {
        draft.completedMissionIds.push(mission.id);
        draft.casesCompletedThisRun += 1;
        draft.lastMissionId = mission.id;
        draft.lastChosenHub = mission.hub;
        draft.lastChosenIssueType = mission.issueType;
      }
      draft.selectedMissionId = null;
      draft.currentFeedback = null;
      refreshOfferSet();
    }, { renderAfter: false, recomputeMetrics: true });

    pendingReturnMissionId = null;
    if (state.pipEnabled) {
      openPipOverlay(true);
      return;
    }
    navigate(runCompleted() ? 'complete' : 'map');
  }

  function updateRationaleField(field, value) {
    const mission = currentMission();
    if (!mission) return;
    commit((draft) => {
      draft.rationaleDraftsByMissionId = draft.rationaleDraftsByMissionId || {};
      draft.rationaleDraftsByMissionId[mission.id] = {
        ...(draft.rationaleDraftsByMissionId[mission.id] || {}),
        [field]: value
      };
    }, { renderAfter: false });
  }

  function updateReflectionField(field, value) {
    commit((draft) => {
      draft.reflectionResponses = {
        ...draft.reflectionResponses,
        [field]: value
      };
    }, { renderAfter: false });
  }

  function submitReflection() {
    const responses = state.reflectionResponses || {};
    const values = Object.values(responses).map((value) => String(value || '').trim());
    if (values.some((value) => value.length < 20)) {
      window.alert('Please answer all three reflection prompts with short, complete responses before finalizing.');
      return;
    }

    commit((draft) => {
      draft.reflectionSubmitted = true;
    });
  }

  function startNewRun() {
    const confirmed = window.confirm('Start a new academic prototype run? This resets all decisions and reflection notes.');
    if (!confirmed) return;
    state = clearState();
    state.runSeed = getRunSeed(RUN_CONFIG.RANDOMNESS_SEED_MODE);
    state.runId = createRunId(state.runSeed);
    initializeRun(false);
    navigate('map');
=======
    const minCategory = Math.min(...Object.values(state.categories));
    state.BII = Math.round(result.BII);
    state.minCategory = minCategory;
    state.variance = computeVariance(state.categories);
    state.topGatePassed = checkTopGate(state.categories, state.variance, SCORING_CONSTANTS);
    state.ratingBand = classifyRating(state.BII, state.topGatePassed, SCORING_CONSTANTS);
    if (state.topGatePassed) {
      state.topGateLockReason = '';
    } else {
      const hasNegative = Object.values(state.categories).some(value => value < 0);
      if (minCategory < SCORING_CONSTANTS.vMinCategoryTop) {
        state.topGateLockReason = `every category must be at least ${SCORING_CONSTANTS.vMinCategoryTop}`;
      } else if (state.variance > SCORING_CONSTANTS.vMaxVarianceTop) {
        state.topGateLockReason = `variance must be ${SCORING_CONSTANTS.vMaxVarianceTop} or lower`;
      } else if (SCORING_CONSTANTS.vNoNegativesTop && hasNegative) {
        state.topGateLockReason = 'no category can be negative';
      } else if (state.BII < SCORING_CONSTANTS.ratingThresholds.top) {
        state.topGateLockReason = `BII must be at least ${SCORING_CONSTANTS.ratingThresholds.top}`;
      } else {
        state.topGateLockReason = 'one or more top-tier requirements are unmet';
      }
    }
    state.finalNarrative = getFinalNarrative();
    state.pipVoluntaryIndicator = !state.topGatePassed && state.casesCompletedThisRun >= 2;
    refreshTurnHeaderSignals();
  }

  function evaluatePoorOutcome(deltas) {
    const net = Object.values(deltas).reduce((acc, n) => acc + n, 0);
    return net < 0;
  }

  function summarizeFeedbackOutcome(feedbackText, poorOutcome) {
    const cleanText = String(feedbackText || '').replace(/\s+/g, ' ').trim();
    const firstSentence = cleanText.split(/(?<=[.!?])\s+/)[0] || cleanText;
    if (firstSentence) return firstSentence.slice(0, 180);
    return poorOutcome
      ? 'Net-negative outcome; plan a balancing mission next.'
      : 'Stable-to-positive outcome; continue balancing weak categories.';
  }

  function selectMission(missionId) {
    if (state.completedMissionIds.includes(missionId)) return;
    if (!(state.offerSetMissionIds || []).includes(missionId)) return;
    commit(draft => {
      draft.selectedMissionId = missionId;
      draft.impactPointsRemaining = SCORING_CONSTANTS.impactBudgetPerHotspot;
      clearDecisionDeltaIndicatorsOnSceneChange(draft, 'explore');
      draft.currentScreen = 'explore';
    });
  }

  function selectHotspot(hotspotId, { focusCta = false } = {}) {
    if (!(state.offerSetMissionIds || []).includes(hotspotId)) return;
    const changed = state.selectedHotspotId !== hotspotId;
    if (!changed) return;

    if (focusCta) pendingCtaFocusMissionId = hotspotId;
    commit(draft => {
      draft.selectedHotspotId = hotspotId;
    });
  }

  function surprisePickMission() {
    const offeredMissionIds = (state.offerSetMissionIds || []).filter(id => missionById[id]);
    if (!offeredMissionIds.length) return;

    const selectableIds = offeredMissionIds.filter(id => id !== state.selectedHotspotId);
    const candidateIds = selectableIds.length ? selectableIds : offeredMissionIds;
    const seed = `${state.runSeed}:${state.casesCompletedThisRun}:${state.decisionCount}:surprise`;
    const rng = createRunRng(seed);
    const chosenId = candidateIds[Math.floor(rng() * candidateIds.length)] || candidateIds[0];
    selectHotspot(chosenId, { focusCta: true });
  }

  function getStoryboardOrderedHotspotIds() {
    const markers = Array.from(mainEl.querySelectorAll('[data-hotspot-id][data-district-key]'));
    if (!markers.length) return [];

    markers.sort((left, right) => {
      const leftDistrict = left.getAttribute('data-district-key') || '';
      const rightDistrict = right.getAttribute('data-district-key') || '';
      const leftIndex = DISTRICT_STORYBOARD_ORDER.indexOf(leftDistrict);
      const rightIndex = DISTRICT_STORYBOARD_ORDER.indexOf(rightDistrict);
      return leftIndex - rightIndex;
    });

    return markers.map(marker => marker.getAttribute('data-hotspot-id')).filter(Boolean);
  }

  function moveHotspotSelectionByArrow(currentHotspotId, direction) {
    const orderedHotspotIds = getStoryboardOrderedHotspotIds();
    if (!orderedHotspotIds.length) return;
    const currentIndex = Math.max(orderedHotspotIds.indexOf(currentHotspotId), 0);
    const nextIndex = (currentIndex + direction + orderedHotspotIds.length) % orderedHotspotIds.length;
    selectHotspot(orderedHotspotIds[nextIndex]);
    requestAnimationFrame(() => {
      const nextButton = mainEl.querySelector(`[data-hotspot-id="${orderedHotspotIds[nextIndex]}"]`);
      if (nextButton) nextButton.focus();
    });
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
  }

  function getPipExplanation() {
    return buildOfferSetExplanation(
      state,
      {
        offerMissionIds: state.offerSetMissionIds || [],
        rolesById: state.offerSetRolesById || {},
        reasonsById: state.offerSetReasonsById || {},
        needs: state.diagnosis
      },
      missionById
    );
  }

<<<<<<< HEAD
  function openPipOverlay(forceOpen = false) {
    state.pipForceOpen = forceOpen;
    pipPanelContent.innerHTML = UI.renderPipPanel(state, getPipExplanation(), missionById, currentMission() || missionById[state.suggestedMissionId]);
    pipOverlay.classList.remove('hidden');
    lastFocusedEl = document.activeElement;
    const closeBtn = document.getElementById('btnPipClose');
    if (closeBtn) closeBtn.focus();
=======
  function handleDialogKeydown(event) {
    if (event.key === 'Escape') return closePipOverlay();
    if (event.key !== 'Tab') return;
    const focusables = pipOverlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openPipOverlay(forceOpen = false) {
    state.pipForceOpen = forceOpen;
    const explanation = getPipExplanation();
    pipPanelContent.innerHTML = UI.renderPipPanel(state, explanation, missionById);
    pipOverlay.classList.remove('hidden');
    lastFocusedEl = document.activeElement;
    pipOverlay.addEventListener('keydown', handleDialogKeydown);
    const firstFocus = document.getElementById('btnPipWhyToggle') || document.getElementById('btnPipClose');
    if (firstFocus) firstFocus.focus();
    bindPipPanelEvents();
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
  }

  function closePipOverlay() {
    pipOverlay.classList.add('hidden');
<<<<<<< HEAD
    commit((draft) => {
      draft.pipEnabled = false;
      draft.pipForceOpen = false;
      draft.currentScreen = runCompleted() ? 'complete' : 'map';
    }, { renderAfter: false });
    if (lastFocusedEl) lastFocusedEl.focus();
    render();
=======
    pipOverlay.removeEventListener('keydown', handleDialogKeydown);
    commit(draft => {
      draft.pipEnabled = false;
      draft.pipForceOpen = false;
    }, { renderAfter: false });
    if (lastFocusedEl) lastFocusedEl.focus();
    navigate(runCompleted() ? 'complete' : 'map');
  }

  function bindPipPanelEvents() {
    const closeBtn = document.getElementById('btnPipClose');
    if (closeBtn) closeBtn.onclick = closePipOverlay;

    const toggle = document.getElementById('btnPipWhyToggle');
    if (toggle) {
      toggle.onclick = () => {
        commit(draft => { draft.pipWhyExpanded = !draft.pipWhyExpanded; }, { renderAfter: false });
        openPipOverlay(state.pipForceOpen);
      };
    }

    const highlightBtn = document.getElementById('btnHighlightMissions');
    if (highlightBtn) {
      highlightBtn.onclick = () => {
        state.highlightMissionIds = state.diagnosis?.remediationMissions || [];
        closePipOverlay();
      };
    }
  }

  function buildSystemInsight(issueType, deltas) {
    const gains = Object.entries(deltas).filter(([, value]) => value > 0).map(([key]) => CATEGORY_LABELS[key]);
    const losses = Object.entries(deltas).filter(([, value]) => value < 0).map(([key]) => CATEGORY_LABELS[key]);
    if (gains.length && losses.length) return `${issueType} trade-off: gains in ${gains.join(', ')} came with pressure on ${losses.join(', ')}.`;
    if (gains.length) return `${issueType} move reinforced ${gains.join(', ')} without immediate category losses.`;
    if (losses.length) return `${issueType} move created system strain in ${losses.join(', ')}; stabilize in the next offer set.`;
    return `${issueType} held categories steady this turn while preserving flexibility for the next step.`;
  }

  function buildTradeoffSpotlight(issueType, deltas) {
    const entries = Object.entries(deltas || {});
    if (!entries.length) return `${issueType} was resolved with limited measurable movement, so monitor stakeholder sentiment before the next case.`;

    const positive = entries.filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1])[0];
    const negative = entries.filter(([, value]) => value < 0).sort((a, b) => a[1] - b[1])[0];
    if (positive && negative) return `${issueType} improved ${CATEGORY_LABELS[positive[0]]} most, but strained ${CATEGORY_LABELS[negative[0]]}, highlighting a tourism trade-off between service gains and system sustainability.`;
    if (positive) return `${issueType} most strongly boosted ${CATEGORY_LABELS[positive[0]]}, with no major downside visible this case across core tourism stakeholders.`;
    if (negative) return `${issueType} most strongly reduced ${CATEGORY_LABELS[negative[0]]}, so prioritize a balancing choice for inclusion and destination quality next.`;
    return `${issueType} delivered a neutral profile this case, so use the next mission to improve sustainability and stakeholder balance.`;
  }


  function buildWhatToTryNext(deltas) {
    const losses = Object.entries(deltas || {})
      .filter(([, value]) => value < 0)
      .sort((a, b) => a[1] - b[1])
      .map(([key]) => CATEGORY_LABELS[key]);
    const gains = Object.entries(deltas || {})
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => CATEGORY_LABELS[key]);

    if (losses.length) {
      return `Prioritize ${losses[0]} next while protecting gains in ${gains[0] || 'your strongest category'}.`;
    }
    if (gains.length) {
      return `Reinforce ${gains[0]} with a low-variance mission to keep categories balanced.`;
    }
    return 'Pick a mission that raises your lowest category without creating new deficits.';
  }

  function trackPatternGamingNudge(displayLabel) {
    state.decisionLabelSelectionCounts = state.decisionLabelSelectionCounts || {};
    const nextCount = (state.decisionLabelSelectionCounts[displayLabel] || 0) + 1;
    state.decisionLabelSelectionCounts[displayLabel] = nextCount;
    if (!state.patternGamingNudgeShownThisRun && nextCount >= PRESENTATION_LABEL_REPEAT_THRESHOLD) {
      state.patternGamingNudgeShownThisRun = true;
      state.showPatternGamingNudge = true;
    }
  }

  function requireLearningNote(option, mission) {
    const note = String(option?.learningNote || '').trim();
    if (note) return note;
    return `Learning note unavailable for ${mission?.name || 'this mission'}; review category deltas to capture the trade-off.`;
  }

  function getDecisionOptionsForMission(mission) {
    if (!mission) return [];
    state.decisionShuffleByMissionId = state.decisionShuffleByMissionId || {};
    let storedOrder = state.decisionShuffleByMissionId[mission.id];

    if (!Array.isArray(storedOrder) || storedOrder.length !== 3) {
      const seededRng = createRunRng(`${state.runSeed}:${mission.id}:decision-options`);
      const shuffledIds = Object.keys(optionsByMissionId[mission.id] || {});
      for (let i = shuffledIds.length - 1; i > 0; i -= 1) {
        const j = Math.floor(seededRng() * (i + 1));
        [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
      }
      storedOrder = shuffledIds;
      commit(draft => {
        draft.decisionShuffleByMissionId = draft.decisionShuffleByMissionId || {};
        draft.decisionShuffleByMissionId[mission.id] = storedOrder;
      }, { renderAfter: false });
    }

    return storedOrder.map((optionId, idx) => {
      const option = optionsByMissionId[mission.id]?.[optionId];
      if (!option) return null;
      return { ...option, originalKey: option.id, displayLabel: String.fromCharCode(65 + idx) };
    }).filter(Boolean);
  }

  function applyDecision(displayLabel) {
    const mission = currentMission();
    if (!mission) return;

    const displayOptions = getDecisionOptionsForMission(mission);
    const option = displayOptions.find(o => o.displayLabel === displayLabel);
    if (!option) return;

    const optionCost = option.cost ?? option.impactCost;
    if (!canAffordDecision(state.impactPointsRemaining, optionCost)) {
      window.alert(`Not enough Impact Points for this decision. Remaining: ${state.impactPointsRemaining}, needed: ${optionCost}.`);
      return;
    }

    const deltas = {
      economic: option.deltas.economic,
      sustainability: option.deltas.sustainability,
      culture: option.deltas.culture,
      hospitality: option.deltas.hospitality,
      satisfaction: option.deltas.satisfaction
    };

    const isCorrect = mission.correctOptionId
      ? option.id === mission.correctOptionId
      : option.isBest === true;

    const poorOutcome = evaluatePoorOutcome(deltas);
    const feedbackOutcome = summarizeFeedbackOutcome(option.feedback, poorOutcome);

    commit(draft => {
      Object.keys(deltas).forEach(key => { draft.categories[key] += deltas[key]; });
      draft.impactPointsRemaining -= optionCost;
      draft.impactPointsSpent += optionCost;
      draft.missionSpendById = draft.missionSpendById || {};
      draft.missionSpendById[mission.id] = optionCost;
      draft.lastDecisionDeltas = { ...deltas };
      draft.lastDecisionOutcomeText = feedbackOutcome;
      draft.decisionCount += 1;
      draft.decisionHistory = draft.decisionHistory || [];
      draft.decisionHistory.push({
        mission: mission.name,
        selectedOption: option.title,
        deltas: { ...deltas },
        pedagogyTags: mission.pedagogy?.tags || [],
        impactCost: optionCost,
        cost: optionCost,
        shortOutcome: feedbackOutcome,
        feedbackOutcome
      });
      trackPatternGamingNudge(displayLabel);
      if (isCorrect) draft.correctCount += 1;
      draft.poorStreak = poorOutcome ? draft.poorStreak + 1 : 0;
      draft.pipEnabled = draft.poorStreak >= 2;
    }, { renderAfter: false, recomputeMetrics: true });

    const feedbackHtml = UI.renderFeedback(
      {
        text: option.feedback,
        deltas,
        poorOutcome,
        impactCost: optionCost,
        pedagogy: mission.pedagogy || {},
        learningNote: requireLearningNote(option, mission),
        systemInsight: buildSystemInsight(mission.issueType || 'Mission', deltas),
        tradeoffSpotlight: buildTradeoffSpotlight(mission.issueType || 'Mission', deltas),
        whatToTryNext: buildWhatToTryNext(deltas)
      },
      state
    );

    pendingReturnMissionId = mission.id;
    document.getElementById('feedbackContainer').innerHTML = feedbackHtml;
    const feedbackCard = document.querySelector('#feedbackContainer section');
    if (feedbackCard) feedbackCard.focus();
  }

  function handleReturnToMap() {
    const missionId = pendingReturnMissionId || state.selectedMissionId;
    const mission = missionById[missionId];
    if (!mission) return;

    commit(draft => {
      draft.hotspotPlayedCount += 1;
      if (!draft.completedMissionIds.includes(mission.id)) {
        draft.completedMissionIds.push(mission.id);
        draft.casesCompletedThisRun += 1;
        draft.lastMissionId = mission.id;
        draft.lastMissionTags = mission.pedagogy?.tags || [];
        draft.lastChosenHub = mission.hub || null;
        draft.lastChosenIssueType = mission.issueType || null;
      }
      draft.selectedMissionId = null;
      draft.highlightMissionIds = [];
      refreshOfferSet();
    }, { renderAfter: false, recomputeMetrics: true });

    pendingReturnMissionId = null;
    if (state.pipEnabled) return openPipOverlay(true);
    navigate(runCompleted() ? 'complete' : 'map');
  }

  function startNewRun() {
    const ok = window.confirm('Start a new Tourism Sampling run? This resets current run progress and generates new per-step offers.');
    if (!ok) return;
    state = clearState();
    state.missionOrder = missions.map(m => m.id);
    initializeRun(true);
    commit(draft => { draft.currentScreen = 'map'; }, { renderAfter: true });
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
  }

  function bindGlobalEvents() {
    document.getElementById('btnDashboard').addEventListener('click', () => {
      dashboardContent.innerHTML = UI.renderDashboard(state, RUN_CONFIG);
      dashboardPanel.classList.remove('hidden');
<<<<<<< HEAD
=======
      document.getElementById('btnDashboardClose').focus();
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
    });

    document.getElementById('btnDashboardClose').addEventListener('click', () => {
      dashboardPanel.classList.add('hidden');
    });

<<<<<<< HEAD
    document.getElementById('btnReset').addEventListener('click', startNewRun);
    pipOverlay.addEventListener('click', (event) => {
      if (event.target === pipOverlay) closePipOverlay();
    });
  }

  function bindMainEvents() {
    mainEl.addEventListener('click', (event) => {
      const target = event.target.closest('button, [data-hotspot-id], [data-mission-id], [data-option-id]');
      if (!target) return;

      if (target.matches('[data-hotspot-id]')) return selectHotspot(target.getAttribute('data-hotspot-id'));
      if (target.matches('[data-mission-id]')) return selectMission(target.getAttribute('data-mission-id'));
      if (target.matches('#btnToDecision')) return navigate('decision');
      if (target.matches('#btnBackMap')) return navigate('map');
      if (target.matches('#btnAskPipWhy')) return openPipOverlay(false);
      if (target.matches('#btnReturnMap')) return handleReturnToMap();
      if (target.matches('[data-option-id]')) return applyDecision(target.getAttribute('data-option-id'));
      if (target.matches('#btnSubmitReflection')) return submitReflection();
      if (target.matches('#btnPrintReport')) return window.print();
    });

    mainEl.addEventListener('input', (event) => {
      const rationaleField = event.target.getAttribute('data-rationale-field');
      if (rationaleField) {
        updateRationaleField(rationaleField, event.target.value);
        return;
      }

      const reflectionField = event.target.getAttribute('data-reflection-field');
      if (reflectionField) {
        updateReflectionField(reflectionField, event.target.value);
      }
    });

    pipOverlay.addEventListener('click', (event) => {
      const target = event.target.closest('button');
      if (!target) return;
      if (target.matches('#btnPipClose')) closePipOverlay();
=======
    document.getElementById('btnReset').textContent = 'Start New Run';
    document.getElementById('btnReset').addEventListener('click', startNewRun);
  }

  function bindMainDelegatedEvents() {
    mainEl.addEventListener('click', event => {
      const target = event.target.closest('button, [data-hotspot-id], [data-mission-id], [data-option-id]');
      if (!target) return;

      if (target.matches('[data-hotspot-id]')) return selectHotspot(target.getAttribute('data-hotspot-id'), { focusCta: true });
      if (target.matches('[data-mission-id]')) return selectMission(target.getAttribute('data-mission-id'));
      if (target.matches('[data-surprise-mission]')) return surprisePickMission();
      if (target.matches('#btnAskPipWhy')) return openPipOverlay(false);
      if (target.matches('[data-dismiss-map-onboarding]')) return commit(draft => { draft.mapOnboardingDismissed = true; });
      if (target.matches('#btnToDecision')) return navigate('decision');
      if (target.matches('[data-option-id]')) return applyDecision(target.getAttribute('data-option-id'));
      if (target.matches('#btnReturnMap')) return handleReturnToMap();
      if (target.matches('#btnBackMap')) return navigate('map');
    });

    mainEl.addEventListener('keydown', event => {
      const target = event.target.closest('[data-hotspot-id]');
      if (!target) return;
      const hotspotId = target.getAttribute('data-hotspot-id');
      if (!hotspotId) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        return selectHotspot(hotspotId, { focusCta: true });
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        return moveHotspotSelectionByArrow(hotspotId, 1);
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        return moveHotspotSelectionByArrow(hotspotId, -1);
      }
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
    });
  }

  function render() {
    if (!missions.length) {
      mainEl.innerHTML = '<section class="card"><h2>Loading…</h2></section>';
      return;
    }

    if (state.currentScreen === 'map') {
      mainEl.innerHTML = UI.renderMap(state, getOfferedMissions(), SCORING_CONSTANTS, RUN_CONFIG);
<<<<<<< HEAD
=======
      if (state.showPatternGamingNudge) commit(draft => { draft.showPatternGamingNudge = false; }, { renderAfter: false });

      const selectedId = state.selectedHotspotId || null;
      const detailPanel = mainEl.querySelector('.map-mission-detail');
      if (detailPanel && selectedId && lastRenderedMapHotspotId && selectedId !== lastRenderedMapHotspotId && detailPanel.animate) {
        detailPanel.animate(
          [
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          { duration: 180, easing: 'ease-out' }
        );
      }

      if (pendingCtaFocusMissionId && pendingCtaFocusMissionId === selectedId) {
        requestAnimationFrame(() => {
          const ctaButton = mainEl.querySelector('[data-primary-cta="enter-mission"]');
          if (ctaButton) ctaButton.focus();
        });
        pendingCtaFocusMissionId = null;
      }

      lastRenderedMapHotspotId = selectedId;
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
    } else if (state.currentScreen === 'explore') {
      mainEl.innerHTML = UI.renderExploration(currentMission(), state, RUN_CONFIG);
    } else if (state.currentScreen === 'decision') {
      mainEl.innerHTML = UI.renderDecision(currentMission(), state, RUN_CONFIG, getDecisionOptionsForMission(currentMission()));
    } else if (state.currentScreen === 'complete') {
      mainEl.innerHTML = UI.renderGameComplete(state);
    } else {
      state.currentScreen = 'map';
      mainEl.innerHTML = UI.renderMap(state, getOfferedMissions(), SCORING_CONSTANTS, RUN_CONFIG);
    }

    mainEl.focus();
  }

<<<<<<< HEAD
  function buildLookups(items) {
    missionById = {};
    optionsByMissionId = {};
    items.forEach((mission) => {
      missionById[mission.id] = mission;
      optionsByMissionId[mission.id] = {};
      (mission.options || []).forEach((option) => {
        optionsByMissionId[mission.id][option.id] = option;
      });
    });
=======
  function buildMissionLookups(items) {
    const missionLookup = {};
    const optionLookup = {};

    items.forEach(mission => {
      missionLookup[mission.id] = mission;
      const optionMap = {};
      const totals = { economic: 0, sustainability: 0, culture: 0, hospitality: 0, satisfaction: 0 };

      (mission.options || []).forEach(option => {
        optionMap[option.id] = option;
        Object.keys(totals).forEach(category => {
          totals[category] += option.deltas?.[category] || 0;
        });
      });

      const divisor = Math.max((mission.options || []).length, 1);
      mission._avgDeltas = Object.keys(totals).reduce((acc, category) => {
        acc[category] = totals[category] / divisor;
        return acc;
      }, {});
      optionLookup[mission.id] = optionMap;
    });

    missionById = missionLookup;
    optionsByMissionId = optionLookup;
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
  }

  function loadMissionData() {
    return fetch('data/missions.json')
<<<<<<< HEAD
      .then((response) => {
        if (!response.ok) throw new Error('Could not load missions.json');
        return response.json();
      })
      .then((data) => {
        missions = data.missions || [];
        const validation = validateMissions(missions);
        if (validation.errors.length) {
          throw new Error(validation.errors.slice(0, 3).join(' | '));
        }
        buildLookups(missions);
        initializeRun(false);
      })
      .catch((error) => {
        mainEl.innerHTML = `<section class="card"><h2>Load Error</h2><p>${UI.escapeHtml(error.message)}</p></section>`;
=======
      .then(resp => {
        if (!resp.ok) throw new Error('Could not load missions.json');
        return resp.json();
      })
      .then(data => {
        missions = data.missions || [];
        const validation = validateMissions(missions);
        if (validation.warnings.length) console.warn('Mission validation warnings:', validation.warnings);
        if (validation.errors.length) {
          console.error('Mission validation errors:', validation.errors);
          const sampleErrors = validation.errors.slice(0, 3).join(' | ');
          throw new Error(`Mission schema validation failed: ${sampleErrors}`);
        }

        buildMissionLookups(missions);
        state.missionOrder = missions.map(m => m.id);
    
        initializeRun(false);
        saveState(state);
      })
      .catch(err => {
        mainEl.innerHTML = `<section class="card"><h2>Load Error</h2><p>${UI.escapeHtml(err.message)}</p><p class="small">Tip: run from a local server, not file://.</p></section>`;
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
      });
  }

  async function start() {
    bindGlobalEvents();
<<<<<<< HEAD
    bindMainEvents();
=======
    bindMainDelegatedEvents();
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
    await loadMissionData();
    if (runCompleted()) state.currentScreen = 'complete';
    render();
  }

  start();
})();
