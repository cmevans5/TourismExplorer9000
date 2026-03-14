(function () {
  const mainEl = document.getElementById('mainContent');
  const dashboardPanel = document.getElementById('dashboardPanel');
  const dashboardContent = document.getElementById('dashboardContent');
  const pipOverlay = document.getElementById('pipOverlay');
  const pipPanelContent = document.getElementById('pipPanelContent');
  const systemModalOverlay = document.getElementById('systemModalOverlay');
  const systemModalTitle = document.getElementById('systemModalTitle');
  const systemModalMessage = document.getElementById('systemModalMessage');
  const systemModalActions = document.getElementById('systemModalActions');

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
    generateOfferSet,
    buildDiagnosis,
    buildOfferSetExplanation
  } = window.TE9000Adaptation;
  const { validateMissions } = window.TE9000MissionValidation;
  const UI = window.TE9000UI;

  const CATEGORY_LABELS = {
    economic: 'Destination Economics',
    sustainability: 'Environmental Sustainability',
    culture: 'Community and Cultural Stewardship',
    hospitality: 'Hospitality and Service Quality',
    satisfaction: 'Visitor Experience'
  };

  let state = loadState();
  let missions = [];
  let missionById = {};
  let pendingReturnMissionId = null;
  let lastFocusedEl = null;
  let systemModalState = null;

  function persistState() {
    try {
      saveState(state);
    } catch (error) {
      console.warn('State persistence failed after a scene update.', error);
    }
  }

  function commit(mutator, { renderAfter = true, recomputeMetrics = false } = {}) {
    mutator(state);
    if (recomputeMetrics) computeAndStoreMetrics();
    if (renderAfter) render();
    persistState();
  }

  function currentMission() {
    return missionById[state.selectedMissionId] || null;
  }

  function activeMission() {
    return currentMission() || missionById[state.selectedHotspotId] || getVisibleMissions()[0] || null;
  }

  function runCompleted() {
    return state.casesCompletedThisRun >= RUN_CONFIG.RUN_LENGTH;
  }

  function getOfferedMissions() {
    return (state.offerSetMissionIds || []).map((id) => missionById[id]).filter(Boolean);
  }

  function getVisibleMissions() {
    const offeredMissions = getOfferedMissions();
    if (offeredMissions.length) return offeredMissions;
    return missions
      .filter((mission) => !(state.completedMissionIds || []).includes(mission.id))
      .slice(0, RUN_CONFIG.RUN_LENGTH);
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
  }

  function computeAndStoreMetrics() {
    const result = computeBII(
      state.categories,
      { remainingImpactPoints: state.impactPointsRemaining, totalSpent: state.impactPointsSpent },
      SCORING_CONSTANTS
    );

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
    let offer = generateOfferSet(missions, state, SCORING_CONSTANTS, RUN_CONFIG);
    const hasProgress = (state.decisionCount || 0) > 0 || (state.completedMissionIds || []).length > 0;

    if (!offer.offerMissionIds.length && missions.length && !runCompleted() && !hasProgress) {
      offer = {
        offerMissionIds: missions.slice(0, RUN_CONFIG.RUN_LENGTH).map((mission) => mission.id),
        rolesById: {},
        reasonsById: {}
      };
      offer.offerMissionIds.forEach((missionId, index) => {
        const mission = missionById[missionId];
        offer.rolesById[missionId] = index === 0 ? 'current' : (index === 1 ? 'next' : 'later');
        offer.reasonsById[missionId] = [
          mission?.tourismDomain,
          mission?.learningObjectives?.[0] || 'Practice tourism systems reasoning.',
          mission?.constraints?.[0] || 'Balance destination outcomes and stakeholder needs.'
        ].filter(Boolean);
      });
    }

    state.offerSetMissionIds = offer.offerMissionIds;
    state.offerSetRolesById = offer.rolesById;
    state.offerSetReasonsById = offer.reasonsById;
    state.suggestedMissionId = offer.offerMissionIds[0] || null;
    if (!offer.offerMissionIds.includes(state.selectedHotspotId)) {
      state.selectedHotspotId = offer.offerMissionIds[0] || null;
    }
    state.diagnosis = buildDiagnosis(state, SCORING_CONSTANTS, offer);
  }

  function ensurePlayableQueue() {
    if (!missions.length || runCompleted()) return;

    const visibleMissions = getVisibleMissions();
    if (visibleMissions.length) return;

    refreshOfferSet();
    if (getVisibleMissions().length) return;

    const fallbackMissionIds = missions
      .filter((mission) => !(state.completedMissionIds || []).includes(mission.id))
      .slice(0, RUN_CONFIG.RUN_LENGTH)
      .map((mission) => mission.id);

    state.offerSetMissionIds = fallbackMissionIds;
    state.offerSetRolesById = {};
    state.offerSetReasonsById = {};
    fallbackMissionIds.forEach((missionId, index) => {
      const mission = missionById[missionId];
      state.offerSetRolesById[missionId] = index === 0 ? 'current' : (index === 1 ? 'next' : 'later');
      state.offerSetReasonsById[missionId] = [
        mission?.tourismDomain,
        mission?.learningObjectives?.[0] || 'Practice tourism systems reasoning.',
        mission?.constraints?.[0] || 'Balance destination outcomes and stakeholder needs.'
      ].filter(Boolean);
    });
    state.suggestedMissionId = fallbackMissionIds[0] || null;
    state.selectedHotspotId = fallbackMissionIds[0] || null;
    state.diagnosis = buildDiagnosis(state, SCORING_CONSTANTS, {
      offerMissionIds: fallbackMissionIds
    });
    persistState();
  }

  function sanitizeStateAfterMissionLoad() {
    const validMissionIds = new Set(missions.map((mission) => mission.id));
    const completedMissionIds = (state.completedMissionIds || []).filter((id) => validMissionIds.has(id));
    const completedMissionSet = new Set(completedMissionIds);

    state.completedMissionIds = completedMissionIds;
    state.offerSetMissionIds = (state.offerSetMissionIds || []).filter((id) => validMissionIds.has(id) && !completedMissionSet.has(id));
    state.offerSetRolesById = Object.fromEntries(
      Object.entries(state.offerSetRolesById || {}).filter(([id]) => validMissionIds.has(id) && !completedMissionSet.has(id))
    );
    state.offerSetReasonsById = Object.fromEntries(
      Object.entries(state.offerSetReasonsById || {}).filter(([id]) => validMissionIds.has(id) && !completedMissionSet.has(id))
    );
    state.suggestedMissionId = validMissionIds.has(state.suggestedMissionId) ? state.suggestedMissionId : null;
    state.selectedMissionId = validMissionIds.has(state.selectedMissionId) ? state.selectedMissionId : null;
    state.selectedHotspotId = validMissionIds.has(state.selectedHotspotId) ? state.selectedHotspotId : null;
    state.lastMissionId = validMissionIds.has(state.lastMissionId) ? state.lastMissionId : null;
    state.highlightMissionIds = (state.highlightMissionIds || []).filter((id) => validMissionIds.has(id));
    state.casesCompletedThisRun = Math.min(completedMissionIds.length, RUN_CONFIG.RUN_LENGTH);

    if ((state.currentScreen === 'explore' || state.currentScreen === 'decision' || state.currentScreen === 'feedback') && !state.selectedMissionId) {
      state.currentScreen = 'map';
    }
  }

  function initializeRun(forceNew = false) {
    if (!missions.length) return;

    if (forceNew || !state.runId) {
      state = clearState();
      state.runSeed = getRunSeed(RUN_CONFIG.RANDOMNESS_SEED_MODE);
      state.runId = createRunId(state.runSeed);
      state.selectedHotspotId = missions[0]?.id || null;
    }

    sanitizeStateAfterMissionLoad();
    computeAndStoreMetrics();
    refreshOfferSet();
    ensurePlayableQueue();
    persistState();
  }

  function navigate(screen) {
    if (screen === 'decision') {
      const mission = activeMission() || selectedOrFirstVisibleMission();
      if (!mission) {
        commit((draft) => {
          draft.currentScreen = 'map';
        });
        return;
      }

      commit((draft) => {
        draft.selectedHotspotId = mission.id;
        draft.currentScreen = 'decision';
        draft.currentFeedback = null;
        if (!draft.impactPointsRemaining) {
          draft.impactPointsRemaining = SCORING_CONSTANTS.impactBudgetPerHotspot;
        }
        ensureMissionDraft(draft, mission.id);
      });
      return;
    }

    commit((draft) => {
      draft.currentScreen = screen;
    });
  }

  function selectHotspot(missionId) {
    if (!getVisibleMissions().some((mission) => mission.id === missionId)) return;
    commit((draft) => {
      draft.selectedHotspotId = missionId;
    });
  }

  function ensureMissionDraft(draftState, missionId) {
    draftState.rationaleDraftsByMissionId = draftState.rationaleDraftsByMissionId || {};
    draftState.rationaleDraftsByMissionId[missionId] = draftState.rationaleDraftsByMissionId[missionId] || {
      stakeholderId: '',
      evidenceId: '',
      tradeoff: ''
    };
  }

  function selectMission(missionId) {
    if (!missionById[missionId]) return;
    if ((state.completedMissionIds || []).includes(missionId)) return;

    commit((draft) => {
      draft.selectedHotspotId = missionId;
      draft.selectedMissionId = null;
      draft.currentFeedback = null;
      draft.lastDecisionDeltas = null;
      draft.lastDecisionOutcomeText = '';
    }, { renderAfter: false });
    navigate('explore');
  }

  function openFirstMissionInQueue() {
    const nextMission = getVisibleMissions()[0];
    if (!nextMission) {
      navigate('map');
      return;
    }
    selectMission(nextMission.id);
  }

  function selectedOrFirstVisibleMission() {
    return missionById[state.selectedHotspotId] || getVisibleMissions()[0] || null;
  }

  function getDecisionOptionsForMission(mission) {
    if (!mission || !Array.isArray(mission.options)) return [];
    return mission.options.filter(Boolean).map((option, index) => ({
      ...option,
      originalKey: option.id,
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
      openSystemModal({
        title: 'Decision Guidance',
        message: 'Before choosing an option, select a stakeholder, cite one evidence point, and write a brief trade-off explanation of at least 30 characters.',
        confirmLabel: 'Back to Briefing'
      });
      return null;
    }
    return result;
  }

  function readRationaleDraftFromDom() {
    const stakeholderField = mainEl.querySelector('[data-rationale-field="stakeholderId"]');
    const evidenceField = mainEl.querySelector('[data-rationale-field="evidenceId"]');
    const tradeoffField = mainEl.querySelector('[data-rationale-field="tradeoff"]');
    return {
      stakeholderId: stakeholderField?.value || '',
      evidenceId: evidenceField?.value || '',
      tradeoff: tradeoffField?.value || ''
    };
  }

  function applyDecision(optionId) {
    const mission = activeMission();
    if (!mission) return;

    const draft = {
      ...getRationaleDraft(mission.id),
      ...readRationaleDraftFromDom()
    };
    const rationale = validateRationale(mission, draft);
    if (!rationale) return;

    const displayOptions = getDecisionOptionsForMission(mission);
    const option = displayOptions.find((item) => item.id === optionId);
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
      draftState.currentScreen = 'feedback';
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
      draftState.rationaleDraftsByMissionId = draftState.rationaleDraftsByMissionId || {};
      draftState.rationaleDraftsByMissionId[mission.id] = draft;
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
    }, { renderAfter: true, recomputeMetrics: true });

    pendingReturnMissionId = mission.id;
  }

  function handleReturnToMap() {
    const mission = activeMission() || missionById[pendingReturnMissionId] || selectedOrFirstVisibleMission();

    commit((draft) => {
      if (mission && !draft.completedMissionIds.includes(mission.id)) {
        draft.completedMissionIds.push(mission.id);
        draft.casesCompletedThisRun += 1;
        draft.lastMissionId = mission.id;
        draft.lastChosenHub = mission.hub;
        draft.lastChosenIssueType = mission.issueType;
      }
      draft.selectedMissionId = null;
      draft.currentFeedback = null;
      refreshOfferSet();
      draft.currentScreen = draft.casesCompletedThisRun >= RUN_CONFIG.RUN_LENGTH ? 'complete' : 'map';
    }, { renderAfter: false, recomputeMetrics: true });

    pendingReturnMissionId = null;
    state.pipForceOpen = false;
    render();
  }

  function updateRationaleField(field, value) {
    const mission = activeMission();
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
      openSystemModal({
        title: 'Reflection Incomplete',
        message: 'Please answer all three reflection prompts with short, complete responses before finalizing.',
        confirmLabel: 'Continue Writing'
      });
      return;
    }

    commit((draft) => {
      draft.reflectionSubmitted = true;
    });
  }

  function startNewRun() {
    openSystemModal({
      title: 'Start New Run?',
      message: 'This resets all decisions and reflection notes for the current academic prototype run.',
      confirmLabel: 'Start Fresh',
      cancelLabel: 'Stay Here',
      tone: 'danger',
      onConfirm: () => {
        state = clearState();
        initializeRun(true);
        navigate('explore');
      }
    });
  }

  function closeSystemModal() {
    systemModalOverlay.classList.add('hidden');
    systemModalActions.innerHTML = '';
    systemModalState = null;
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  function openSystemModal({
    title,
    message,
    confirmLabel = 'Continue',
    cancelLabel = '',
    tone = '',
    onConfirm = null
  }) {
    systemModalState = { onConfirm };
    systemModalTitle.textContent = title;
    systemModalMessage.textContent = message;
    systemModalActions.innerHTML = '';

    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.id = 'btnSystemModalConfirm';
    confirmButton.className = `btn ${tone}`.trim();
    confirmButton.textContent = confirmLabel;
    systemModalActions.appendChild(confirmButton);

    if (cancelLabel) {
      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.id = 'btnSystemModalCancel';
      cancelButton.className = 'btn secondary';
      cancelButton.textContent = cancelLabel;
      systemModalActions.appendChild(cancelButton);
    }

    lastFocusedEl = document.activeElement;
    systemModalOverlay.classList.remove('hidden');
    confirmButton.focus();
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

  function openPipOverlay(forceOpen = false) {
    state.pipForceOpen = forceOpen;
    pipPanelContent.innerHTML = UI.renderPipPanel(state, getPipExplanation(), missionById, currentMission() || missionById[state.suggestedMissionId]);
    pipOverlay.classList.remove('hidden');
    lastFocusedEl = document.activeElement;
    const closeBtn = document.getElementById('btnPipClose');
    if (closeBtn) closeBtn.focus();
  }

  function closePipOverlay() {
    pipOverlay.classList.add('hidden');
    commit((draft) => {
      draft.pipEnabled = false;
      draft.pipForceOpen = false;
      draft.currentScreen = runCompleted() ? 'complete' : 'map';
    }, { renderAfter: false });
    if (lastFocusedEl) lastFocusedEl.focus();
    render();
  }

  function bindGlobalEvents() {
    document.getElementById('btnDashboard').addEventListener('click', () => {
      dashboardContent.innerHTML = UI.renderDashboard(state, RUN_CONFIG);
      dashboardPanel.classList.remove('hidden');
    });

    document.getElementById('btnDashboardClose').addEventListener('click', () => {
      dashboardPanel.classList.add('hidden');
    });

    document.getElementById('btnReset').addEventListener('click', startNewRun);
    pipOverlay.addEventListener('click', (event) => {
      if (event.target === pipOverlay) closePipOverlay();
    });
    systemModalOverlay.addEventListener('click', (event) => {
      if (event.target === systemModalOverlay && systemModalActions.querySelector('#btnSystemModalCancel')) {
        closeSystemModal();
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !systemModalOverlay.classList.contains('hidden')) {
        closeSystemModal();
      }
    });
  }

  function bindMainEvents() {
    pipOverlay.addEventListener('click', (event) => {
      const target = event.target.closest('button');
      if (!target) return;
      if (target.matches('#btnPipClose')) closePipOverlay();
    });

    systemModalOverlay.addEventListener('click', (event) => {
      const target = event.target.closest('button');
      if (!target) return;
      if (target.matches('#btnSystemModalCancel')) {
        closeSystemModal();
        return;
      }
      if (target.matches('#btnSystemModalConfirm')) {
        const onConfirm = systemModalState?.onConfirm;
        closeSystemModal();
        if (typeof onConfirm === 'function') onConfirm();
      }
    });
  }

  function bindRenderedScreenEvents() {
    mainEl.querySelectorAll('[data-hotspot-id]').forEach((button) => {
      button.addEventListener('click', () => {
        selectHotspot(button.getAttribute('data-hotspot-id'));
      });
    });

    mainEl.querySelectorAll('[data-mission-id]').forEach((button) => {
      button.addEventListener('click', () => {
        selectMission(button.getAttribute('data-mission-id'));
      });
    });

    mainEl.querySelectorAll('[data-option-id]').forEach((button) => {
      button.addEventListener('click', () => {
        applyDecision(button.getAttribute('data-option-id'));
      });
    });

    mainEl.querySelectorAll('[data-rationale-field]').forEach((field) => {
      const syncField = () => updateRationaleField(field.getAttribute('data-rationale-field'), field.value);
      field.addEventListener('input', syncField);
      field.addEventListener('change', syncField);
    });

    mainEl.querySelectorAll('[data-reflection-field]').forEach((field) => {
      const syncField = () => updateReflectionField(field.getAttribute('data-reflection-field'), field.value);
      field.addEventListener('input', syncField);
      field.addEventListener('change', syncField);
    });

    const backMapButton = mainEl.querySelector('#btnBackMap');
    if (backMapButton) {
      backMapButton.addEventListener('click', () => navigate('map'));
    }

    const toDecisionButton = mainEl.querySelector('#btnToDecision');
    if (toDecisionButton) {
      toDecisionButton.addEventListener('click', () => navigate('decision'));
    }

    const pipButton = mainEl.querySelector('#btnAskPipWhy');
    if (pipButton) {
      pipButton.addEventListener('click', () => openPipOverlay(false));
    }

    const startSelectedCaseButton = mainEl.querySelector('#btnStartSelectedCase');
    if (startSelectedCaseButton) {
      startSelectedCaseButton.addEventListener('click', () => navigate('explore'));
    }

    const openBriefingButton = mainEl.querySelector('#btnOpenBriefing');
    if (openBriefingButton) {
      openBriefingButton.addEventListener('click', () => navigate('explore'));
    }

    const returnMapButton = mainEl.querySelector('#btnReturnMap');
    if (returnMapButton) {
      returnMapButton.addEventListener('click', handleReturnToMap);
    }

    const submitReflectionButton = mainEl.querySelector('#btnSubmitReflection');
    if (submitReflectionButton) {
      submitReflectionButton.addEventListener('click', submitReflection);
    }

    const printButton = mainEl.querySelector('#btnPrintReport');
    if (printButton) {
      printButton.addEventListener('click', () => window.print());
    }
  }

  function renderScreen() {
    if (!missions.length) {
      mainEl.innerHTML = '<section class="card"><h2>Loading…</h2></section>';
      return;
    }

    const mission = activeMission();

    if (state.currentScreen === 'map') {
      mainEl.innerHTML = UI.renderMap(state, getVisibleMissions(), SCORING_CONSTANTS, RUN_CONFIG);
    } else if (state.currentScreen === 'explore') {
      mainEl.innerHTML = mission
        ? UI.renderExploration(mission, state, RUN_CONFIG)
        : UI.renderMap(state, getVisibleMissions(), SCORING_CONSTANTS, RUN_CONFIG);
    } else if (state.currentScreen === 'decision') {
      mainEl.innerHTML = mission
        ? UI.renderDecision(mission, state, RUN_CONFIG, getDecisionOptionsForMission(mission))
        : UI.renderMap(state, getVisibleMissions(), SCORING_CONSTANTS, RUN_CONFIG);
    } else if (state.currentScreen === 'feedback') {
      mainEl.innerHTML = mission && state.currentFeedback
        ? UI.renderFeedbackScreen(mission, state, RUN_CONFIG)
        : UI.renderMap(state, getVisibleMissions(), SCORING_CONSTANTS, RUN_CONFIG);
    } else if (state.currentScreen === 'complete') {
      mainEl.innerHTML = UI.renderGameComplete(state);
    } else {
      state.currentScreen = 'map';
      mainEl.innerHTML = UI.renderMap(state, getVisibleMissions(), SCORING_CONSTANTS, RUN_CONFIG);
    }

  }

  function render() {
    try {
      renderScreen();
    } catch (error) {
      console.error('Scene render failed.', error);
      window.__TE9000LastRenderError = {
        message: error?.message || 'Unknown render error',
        stack: error?.stack || ''
      };
      state.currentScreen = 'map';
      mainEl.innerHTML = `
        <section class="console-shell card">
          <p class="district-label">Tourism Learning Studio</p>
          <h2>Scene Transition Error</h2>
          <p>The app hit a render problem while trying to open the next scene.</p>
          <p class="small"><strong>Screen:</strong> ${UI.escapeHtml(state.currentScreen)}</p>
          <p class="small"><strong>Details:</strong> ${UI.escapeHtml(error?.message || 'Unknown render error')}</p>
          <div class="inline-actions">
            <button type="button" id="btnBackMap" class="btn secondary">Return to Map</button>
          </div>
        </section>
      `;
    }

    bindRenderedScreenEvents();
    mainEl.scrollTop = 0;
    if (state.currentScreen === 'feedback') {
      const feedbackCard = mainEl.querySelector('.scene-feedback');
      if (feedbackCard && typeof feedbackCard.focus === 'function') {
        feedbackCard.focus();
        return;
      }
    }
    if (typeof mainEl.focus === 'function') {
      try {
        mainEl.focus({ preventScroll: true });
      } catch (_error) {
        mainEl.focus();
      }
    }
  }

  function buildLookups(items) {
    missionById = {};
    items.forEach((mission) => {
      missionById[mission.id] = mission;
    });
  }

  function loadMissionData() {
    return fetch('data/missions.json')
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
      });
  }

  async function start() {
    bindGlobalEvents();
    bindMainEvents();
    await loadMissionData();
    if (runCompleted()) state.currentScreen = 'complete';
    render();
  }

  window.TE9000App = {
    navigate,
    selectHotspot,
    selectMission,
    startNewRun,
    applyDecision,
    handleReturnToMap,
    submitReflection,
    openPipOverlay: () => openPipOverlay(false),
    closePipOverlay
  };

  start();
})();
