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
  const UI = window.TE9000UI;

  const CATEGORY_LABELS = {
    economic: 'Economic Capital',
    sustainability: 'Sustainability',
    culture: 'Cultural Inclusion',
    hospitality: 'Hospitality',
    satisfaction: 'Visitor Satisfaction'
  };

  let state = loadState();
  let missions = [];
  let lastFocusedEl = null;

  function getOfferedMissions() {
    const ids = new Set(state.offerSetMissionIds || []);
    return missions.filter(mission => ids.has(mission.id));
  }

  function currentMission() {
    return state.selectedMissionId ? state.missionById[state.selectedMissionId] : null;
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

    if (state.BII >= 75 && state.topGatePassed) {
      return `Your strategy produced a resilient tourism portfolio with strong ${hi} while keeping system trade-offs under control.`;
    }

    if (state.variance > SCORING_CONSTANTS.vMaxVarianceTop) {
      return `Your strategy strengthened ${hi}, but large imbalances left ${lo} under-supported. The next cycle should rebalance system pressures.`;
    }

    return `Your strategy improved ${hi}, but ${lo} lagged behind. Reallocate future Impact Points toward cross-category resilience.`;
  }

  function refreshOfferSet() {
    if (runCompleted()) {
      state.offerSetMissionIds = [];
      state.offerSetRolesById = {};
      state.offerSetReasonsById = {};
      state.diagnosis = buildDiagnosis(state, SCORING_CONSTANTS, {
        offerMissionIds: [],
        rolesById: {},
        reasonsById: {},
        needs: null
      });
      return;
    }

    const seedInput = `${state.runSeed}:${state.casesCompletedThisRun}:${(state.completedMissionIds || []).join(',')}`;
    const offer = generateOfferSet(missions, state, SCORING_CONSTANTS, RUN_CONFIG, createRunRng(seedInput));
    state.offerSetMissionIds = offer.offerMissionIds;
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
      state.categories = {
        economic: 0,
        sustainability: 0,
        culture: 0,
        hospitality: 0,
        satisfaction: 0
      };
      state.missionSpendById = {};
    }

    computeAndStoreMetrics();
    refreshOfferSet();
  }

  function navigate(screen) {
    state.currentScreen = screen;
    saveState(state);
    render();
  }

  function computeAndStoreMetrics() {
    const completedHotspots = Math.max(1, state.completedMissionIds.length || 1);
    const totalRemainingImpactPoints = state.completedMissionIds.reduce((acc, missionId) => {
      const mission = state.missionById[missionId];
      if (!mission) return acc;
      const spent = state.missionSpendById?.[missionId] || 0;
      return acc + (SCORING_CONSTANTS.impactBudgetPerHotspot - spent);
    }, 0);

    const result = computeBII(
      state.categories,
      {
        remainingImpactPoints: state.impactPointsRemaining,
        totalSpent: state.impactPointsSpent
      },
      SCORING_CONSTANTS
    );

    const minCategory = Math.min(...Object.values(state.categories));
    state.BII = Math.round(result.BII);
    state.minCategory = minCategory;
    state.variance = computeVariance(state.categories);
    state.topGatePassed = checkTopGate(
      state.categories,
      state.variance,
      {
        completedHotspots,
        totalRemainingImpactPoints
      },
      SCORING_CONSTANTS
    );
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
    state.selectedMissionId = missionId;
    state.impactPointsRemaining = SCORING_CONSTANTS.impactBudgetPerHotspot;
    state.currentScreen = 'explore';
    saveState(state);
    render();
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
      state.missionById || {}
    );
  }

  function handleDialogKeydown(event) {
    if (event.key === 'Escape') {
      closePipOverlay();
      return;
    }
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
    pipPanelContent.innerHTML = UI.renderPipPanel(state, explanation, state.missionById || {});
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
    state.pipEnabled = false;
    state.pipForceOpen = false;
    saveState(state);
    if (lastFocusedEl) lastFocusedEl.focus();
    navigate(runCompleted() ? 'complete' : 'map');
  }

  function bindPipPanelEvents() {
    const closeBtn = document.getElementById('btnPipClose');
    if (closeBtn) closeBtn.addEventListener('click', closePipOverlay);

    const toggle = document.getElementById('btnPipWhyToggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        state.pipWhyExpanded = !state.pipWhyExpanded;
        saveState(state);
        openPipOverlay(state.pipForceOpen);
      });
    }

    const highlightBtn = document.getElementById('btnHighlightMissions');
    if (highlightBtn) {
      highlightBtn.addEventListener('click', () => {
        state.highlightMissionIds = state.diagnosis?.remediationMissions || [];
        closePipOverlay();
      });
    }
  }

  function buildSystemInsight(issueType, deltas) {
    const gains = Object.entries(deltas).filter(([, value]) => value > 0).map(([key]) => CATEGORY_LABELS[key]);
    const losses = Object.entries(deltas).filter(([, value]) => value < 0).map(([key]) => CATEGORY_LABELS[key]);

    if (gains.length && losses.length) {
      return `${issueType} trade-off: gains in ${gains.join(', ')} came with pressure on ${losses.join(', ')}.`;
    }
    if (gains.length) {
      return `${issueType} move reinforced ${gains.join(', ')} without immediate category losses.`;
    }
    return `${issueType} move created system strain in ${losses.join(', ')}; stabilize in the next offer set.`;
  }

  function applyDecision(optionId) {
    const mission = currentMission();
    if (!mission) return;

    const option = mission.options.find(o => o.id === optionId);
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

    Object.keys(deltas).forEach(key => {
      state.categories[key] += deltas[key];
    });

    state.impactPointsRemaining -= optionCost;
    state.impactPointsSpent += optionCost;
    state.missionSpendById = state.missionSpendById || {};
    state.missionSpendById[mission.id] = optionCost;

    state.lastDecisionDeltas = deltas;
    state.decisionCount += 1;
    if (optionId === 'B') state.correctCount += 1;

    const poorOutcome = evaluatePoorOutcome(deltas);
    state.poorStreak = poorOutcome ? state.poorStreak + 1 : 0;
    state.pipEnabled = state.poorStreak >= 2;

    computeAndStoreMetrics();
    saveState(state);

    const feedbackHtml = UI.renderFeedback(
      {
        text: option.feedback,
        deltas,
        poorOutcome,
        impactCost: optionCost,
        learningNote: option.learningNote || 'Learning note unavailable for this option.',
        systemInsight: buildSystemInsight(mission.issueType || 'Mission', deltas)
      },
      state
    );

    document.getElementById('feedbackContainer').innerHTML = feedbackHtml;
    const feedbackCard = document.querySelector('#feedbackContainer section');
    if (feedbackCard) feedbackCard.focus();

    const returnBtn = document.getElementById('btnReturnMap');
    if (returnBtn) {
      returnBtn.addEventListener('click', () => {
        state.hotspotPlayedCount += 1;
        if (!state.completedMissionIds.includes(mission.id)) {
          state.completedMissionIds.push(mission.id);
          state.casesCompletedThisRun += 1;
          state.lastMissionId = mission.id;
          state.lastMissionTags = mission.pedagogy?.tags || [];
          state.lastChosenHub = mission.hub || null;
          state.lastChosenIssueType = mission.issueType || null;
        }
        state.selectedMissionId = null;
        state.highlightMissionIds = [];
        computeAndStoreMetrics();
        refreshOfferSet();
        saveState(state);

        if (state.pipEnabled) {
          openPipOverlay(true);
          return;
        }

        navigate(runCompleted() ? 'complete' : 'map');
      });
    }
  }

  function startNewRun() {
    const ok = window.confirm('Start a new Tourism Sampling run? This resets current run progress and generates new per-step offers.');
    if (!ok) return;
    state = clearState();
    state.missionOrder = missions.map(m => m.id);
    state.missionById = missions.reduce((acc, m) => {
      acc[m.id] = m;
      return acc;
    }, {});
    initializeRun(true);
    saveState(state);
    navigate('map');
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

  function bindScreenEvents() {
    if (state.currentScreen === 'map') {
      mainEl.querySelectorAll('[data-mission-id]').forEach(btn => {
        btn.addEventListener('click', () => selectMission(btn.getAttribute('data-mission-id')));
      });
      const askPip = document.getElementById('btnAskPipWhy');
      if (askPip) askPip.addEventListener('click', () => openPipOverlay(false));
    }

    if (state.currentScreen === 'explore') {
      const next = document.getElementById('btnToDecision');
      if (next) next.addEventListener('click', () => navigate('decision'));
    }

    if (state.currentScreen === 'decision') {
      mainEl.querySelectorAll('[data-option-id]').forEach(btn => {
        btn.addEventListener('click', () => applyDecision(btn.getAttribute('data-option-id')));
      });
    }

    if (state.currentScreen === 'complete') {
      const back = document.getElementById('btnBackMap');
      if (back) back.addEventListener('click', () => navigate('map'));
    }
  }

  function render() {
    if (!missions.length) {
      mainEl.innerHTML = '<section class="card"><h2>Loading…</h2></section>';
      return;
    }

    if (state.currentScreen === 'map') {
      mainEl.innerHTML = UI.renderMap(state, getOfferedMissions(), SCORING_CONSTANTS, RUN_CONFIG);
    } else if (state.currentScreen === 'explore') {
      mainEl.innerHTML = UI.renderExploration(currentMission(), state, RUN_CONFIG);
    } else if (state.currentScreen === 'decision') {
      mainEl.innerHTML = UI.renderDecision(currentMission(), state, RUN_CONFIG);
    } else if (state.currentScreen === 'complete') {
      mainEl.innerHTML = UI.renderGameComplete(state);
    } else {
      state.currentScreen = 'map';
      mainEl.innerHTML = UI.renderMap(state, getOfferedMissions(), SCORING_CONSTANTS, RUN_CONFIG);
    }

    bindScreenEvents();
    mainEl.focus();
  }

  function loadMissionData() {
    return fetch('data/missions.json')
      .then(resp => {
        if (!resp.ok) throw new Error('Could not load missions.json');
        return resp.json();
      })
      .then(data => {
        missions = data.missions || [];
        state.missionOrder = missions.map(m => m.id);
        state.missionById = missions.reduce((acc, m) => {
          acc[m.id] = m;
          return acc;
        }, {});
        initializeRun(false);
        saveState(state);
      })
      .catch(err => {
        mainEl.innerHTML = `<section class="card"><h2>Load Error</h2><p>${err.message}</p><p class="small">Tip: run from a local server, not file://.</p></section>`;
      });
  }

  async function start() {
    bindGlobalEvents();
    await loadMissionData();
    if (runCompleted()) {
      state.currentScreen = 'complete';
    }
    render();
  }

  start();
})();
