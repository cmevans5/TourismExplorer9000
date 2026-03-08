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
    buildOfferSetExplanation,
    buildDiagnosis
  } = window.TE9000Adaptation;
  const { validateMissions } = window.TE9000MissionValidation;
  const UI = window.TE9000UI;

  const CATEGORY_LABELS = {
    economic: 'Economic Capital',
    sustainability: 'Sustainability',
    culture: 'Cultural Inclusion',
    hospitality: 'Hospitality',
    satisfaction: 'Visitor Satisfaction'
  };
  const PRESENTATION_LABEL_REPEAT_THRESHOLD = 3;

  let state = loadState();
  let missions = [];
  let missionById = {};
  let optionsByMissionId = {};
  let lastFocusedEl = null;
  let pendingReturnMissionId = null;

  function commit(mutator, { renderAfter = true, recomputeMetrics = false } = {}) {
    mutator(state);
    if (recomputeMetrics) computeAndStoreMetrics();
    saveState(state);
    if (renderAfter) render();
  }

  function getOfferedMissions() {
    return (state.offerSetMissionIds || []).map(id => missionById[id]).filter(Boolean);
  }

  function currentMission() {
    return state.selectedMissionId ? missionById[state.selectedMissionId] : null;
  }

  function runCompleted() {
    return state.casesCompletedThisRun >= RUN_CONFIG.RUN_LENGTH;
  }

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
    }

    computeAndStoreMetrics();
    refreshOfferSet();
  }

  function navigate(screen) {
    commit(draft => { draft.currentScreen = screen; });
  }

  function computeAndStoreMetrics() {
    const result = computeBII(
      state.categories,
      { remainingImpactPoints: state.impactPointsRemaining, totalSpent: state.impactPointsSpent },
      SCORING_CONSTANTS
    );

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
  }

  function evaluatePoorOutcome(deltas) {
    const net = Object.values(deltas).reduce((acc, n) => acc + n, 0);
    return net < 0;
  }

  function selectMission(missionId) {
    if (state.completedMissionIds.includes(missionId)) return;
    if (!(state.offerSetMissionIds || []).includes(missionId)) return;
    commit(draft => {
      draft.selectedMissionId = missionId;
      draft.impactPointsRemaining = SCORING_CONSTANTS.impactBudgetPerHotspot;
      draft.currentScreen = 'explore';
    });
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
  }

  function closePipOverlay() {
    pipOverlay.classList.add('hidden');
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

    commit(draft => {
      Object.keys(deltas).forEach(key => { draft.categories[key] += deltas[key]; });
      draft.impactPointsRemaining -= optionCost;
      draft.impactPointsSpent += optionCost;
      draft.missionSpendById = draft.missionSpendById || {};
      draft.missionSpendById[mission.id] = optionCost;
      draft.lastDecisionDeltas = deltas;
      draft.decisionCount += 1;
      draft.decisionHistory = draft.decisionHistory || [];
      draft.decisionHistory.push({
        mission: mission.name,
        optionTitle: option.title,
        impactCost: optionCost,
        deltas,
        feedbackNote: option.feedback || ''
      });
      trackPatternGamingNudge(displayLabel);
      if (isCorrect) draft.correctCount += 1;
      const poorOutcome = evaluatePoorOutcome(deltas);
      draft.poorStreak = poorOutcome ? draft.poorStreak + 1 : 0;
      draft.pipEnabled = draft.poorStreak >= 2;
    }, { renderAfter: false, recomputeMetrics: true });

    const poorOutcome = evaluatePoorOutcome(deltas);
    const feedbackHtml = UI.renderFeedback(
      {
        text: option.feedback,
        deltas,
        poorOutcome,
        impactCost: optionCost,
        learningNote: requireLearningNote(option, mission),
        systemInsight: buildSystemInsight(mission.issueType || 'Mission', deltas),
        tradeoffSpotlight: buildTradeoffSpotlight(mission.issueType || 'Mission', deltas)
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
  }

  function bindGlobalEvents() {
    document.getElementById('btnDashboard').addEventListener('click', () => {
      dashboardContent.innerHTML = UI.renderDashboard(state, RUN_CONFIG);
      dashboardPanel.classList.remove('hidden');
      document.getElementById('btnDashboardClose').focus();
    });

    document.getElementById('btnDashboardClose').addEventListener('click', () => {
      dashboardPanel.classList.add('hidden');
    });

    document.getElementById('btnReset').textContent = 'Start New Run';
    document.getElementById('btnReset').addEventListener('click', startNewRun);
  }

  function bindMainDelegatedEvents() {
    mainEl.addEventListener('click', event => {
      const target = event.target.closest('button, [data-mission-id], [data-option-id]');
      if (!target) return;

      if (target.matches('[data-mission-id]')) return selectMission(target.getAttribute('data-mission-id'));
      if (target.matches('#btnAskPipWhy')) return openPipOverlay(false);
      if (target.matches('#btnToDecision')) return navigate('decision');
      if (target.matches('[data-option-id]')) return applyDecision(target.getAttribute('data-option-id'));
      if (target.matches('#btnReturnMap')) return handleReturnToMap();
      if (target.matches('#btnBackMap')) return navigate('map');
    });
  }

  function render() {
    if (!missions.length) {
      mainEl.innerHTML = '<section class="card"><h2>Loading…</h2></section>';
      return;
    }

    if (state.currentScreen === 'map') {
      mainEl.innerHTML = UI.renderMap(state, getOfferedMissions(), SCORING_CONSTANTS, RUN_CONFIG);
      if (state.showPatternGamingNudge) commit(draft => { draft.showPatternGamingNudge = false; }, { renderAfter: false });
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

    if (state.lastDecisionDeltas && state.currentScreen !== 'decision') {
      commit(draft => { draft.lastDecisionDeltas = null; }, { renderAfter: false });
    }
  }

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
  }

  function loadMissionData() {
    return fetch('data/missions.json')
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
      });
  }

  async function start() {
    bindGlobalEvents();
    bindMainDelegatedEvents();
    await loadMissionData();
    if (runCompleted()) state.currentScreen = 'complete';
    render();
  }

  start();
})();
