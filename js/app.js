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
    createRunRng,
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
  let optionsByMissionId = {};
  let pendingReturnMissionId = null;
  let lastFocusedEl = null;
  let systemModalState = null;

  function commit(mutator, { renderAfter = true, recomputeMetrics = false } = {}) {
    mutator(state);
    if (recomputeMetrics) computeAndStoreMetrics();
    saveState(state);
    if (renderAfter) render();
  }

  function currentMission() {
    return missionById[state.selectedMissionId] || null;
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
    saveState(state);
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

    if ((state.currentScreen === 'explore' || state.currentScreen === 'decision') && !state.selectedMissionId) {
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
    saveState(state);
  }

  function navigate(screen) {
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

  function selectMission(missionId) {
    if (!getVisibleMissions().some((mission) => mission.id === missionId)) return;
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

  function openFirstMissionInQueue() {
    const nextMission = getVisibleMissions()[0];
    if (!nextMission) {
      navigate('map');
      return;
    }
    selectMission(nextMission.id);
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
      openSystemModal({
        title: 'Decision Guidance',
        message: 'Before choosing an option, select a stakeholder, cite one evidence point, and write a brief trade-off explanation of at least 30 characters.',
        confirmLabel: 'Back to Briefing'
      });
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
        openFirstMissionInQueue();
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

    const toDecisionButton = mainEl.querySelector('#btnToDecision');
    if (toDecisionButton) {
      toDecisionButton.addEventListener('click', () => navigate('decision'));
    }

    mainEl.querySelectorAll('#btnBackMap').forEach((button) => {
      button.addEventListener('click', () => navigate('map'));
    });

    const askPipButton = mainEl.querySelector('#btnAskPipWhy');
    if (askPipButton) {
      askPipButton.addEventListener('click', () => openPipOverlay(false));
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

  function render() {
    if (!missions.length) {
      mainEl.innerHTML = '<section class="card"><h2>Loading…</h2></section>';
      return;
    }

    if (state.currentScreen === 'map') {
      mainEl.innerHTML = UI.renderMap(state, getVisibleMissions(), SCORING_CONSTANTS, RUN_CONFIG);
    } else if (state.currentScreen === 'explore') {
      mainEl.innerHTML = UI.renderExploration(currentMission(), state, RUN_CONFIG);
    } else if (state.currentScreen === 'decision') {
      mainEl.innerHTML = UI.renderDecision(currentMission(), state, RUN_CONFIG, getDecisionOptionsForMission(currentMission()));
    } else if (state.currentScreen === 'complete') {
      mainEl.innerHTML = UI.renderGameComplete(state);
    } else {
      state.currentScreen = 'map';
      mainEl.innerHTML = UI.renderMap(state, getVisibleMissions(), SCORING_CONSTANTS, RUN_CONFIG);
    }

    bindRenderedScreenEvents();
    mainEl.scrollTop = 0;
    mainEl.focus();
  }

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

  start();
})();
