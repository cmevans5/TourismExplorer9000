(function () {
  const mainEl = document.getElementById('mainContent');
  const dashboardPanel = document.getElementById('dashboardPanel');
  const dashboardContent = document.getElementById('dashboardContent');
  const pipOverlay = document.getElementById('pipOverlay');
  const pipHintText = document.getElementById('pipHintText');

  const {
    SCORING_CONSTANTS,
    computeBII,
    computeVariance,
    canAffordDecision,
    checkTopGate,
    classifyRating
  } = window.TE9000Scoring;
  const { saveState, loadState, clearState } = window.TE9000State;
  const UI = window.TE9000UI;

  const CATEGORY_LABELS = {
    economic: 'Economic Capital',
    sustainability: 'Sustainability',
    culture: 'Cultural Inclusion',
    hospitality: 'Hospitality',
    satisfaction: 'Visitor Satisfaction'
  };

  const PIP_HINTS = {
    sustainabilityLow: 'Sustainability is trailing. Add low-emission transport, waste reduction, and climate-aware design to stabilize long-term outcomes.',
    economicTooHigh: 'Economic gains are outpacing other categories. Reinvest some momentum into culture, sustainability, and resident-facing hospitality to avoid backlash.',
    varianceHigh: 'Your system is too imbalanced. Use the next move to strengthen your weakest category and reduce spread across all outcomes.',
    weakestCategory: 'Target your weakest category next and pair every gain with protection for long-term community trust.'
  };

  let state = loadState();
  let missions = [];

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
        if (!state.selectedMissionId && missions[0]) {
          state.selectedMissionId = missions[0].id;
        }
        saveState(state);
      })
      .catch(err => {
        mainEl.innerHTML = `<section class="card"><h2>Load Error</h2><p>${err.message}</p><p class="small">Tip: run from a local server, not file://.</p></section>`;
      });
  }

  function currentMission() {
    return state.selectedMissionId ? state.missionById[state.selectedMissionId] : null;
  }

  function allMissionsCompleted() {
    return missions.length > 0 && state.completedMissionIds.length >= missions.length;
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
        state.topGateLockReason = `Top Analyst is locked: every category must be at least ${SCORING_CONSTANTS.vMinCategoryTop}.`;
      } else if (state.variance > SCORING_CONSTANTS.vMaxVarianceTop) {
        state.topGateLockReason = `Top Analyst is locked: variance must be ${SCORING_CONSTANTS.vMaxVarianceTop} or lower.`;
      } else if (SCORING_CONSTANTS.vNoNegativesTop && hasNegative) {
        state.topGateLockReason = 'Top Analyst is locked: no category can be negative.';
      } else if (state.BII < SCORING_CONSTANTS.ratingThresholds.top) {
        state.topGateLockReason = `Top Analyst is locked: BII must be at least ${SCORING_CONSTANTS.ratingThresholds.top}.`;
      } else {
        state.topGateLockReason = 'Top Analyst is locked: one or more top-tier requirements are unmet.';
      }
    }
    state.finalNarrative = getFinalNarrative();
  }

  function evaluatePoorOutcome(deltas) {
    const net = Object.values(deltas).reduce((acc, n) => acc + n, 0);
    return net < 0;
  }

  function selectMission(missionId) {
    if (state.completedMissionIds.includes(missionId)) return;
    state.selectedMissionId = missionId;
    state.impactPointsRemaining = SCORING_CONSTANTS.impactBudgetPerHotspot;
    state.currentScreen = 'explore';
    saveState(state);
    render();
  }

  function choosePipHint() {
    const categories = state.categories;
    const entries = Object.entries(categories).sort((a, b) => a[1] - b[1]);
    const lowest = entries[0][0];

    if (lowest === 'sustainability') {
      return PIP_HINTS.sustainabilityLow;
    }

    const avgOther = (categories.sustainability + categories.culture + categories.hospitality + categories.satisfaction) / 4;
    if (categories.economic - avgOther >= 4) {
      return PIP_HINTS.economicTooHigh;
    }

    if (state.variance > SCORING_CONSTANTS.vMaxVarianceTop) {
      return PIP_HINTS.varianceHigh;
    }

    return `${PIP_HINTS.weakestCategory} Lowest now: ${CATEGORY_LABELS[lowest]}.`;
  }

  function showPip() {
    pipHintText.textContent = choosePipHint();
    pipOverlay.classList.remove('hidden');
    document.getElementById('btnPipClose').focus();
  }

  function applyDecision(optionId) {
    const mission = currentMission();
    if (!mission) return;

    const option = mission.options.find(o => o.id === optionId);
    if (!option) return;

    if (!canAffordDecision(state.impactPointsRemaining, option.impactCost)) {
      window.alert(`Not enough Impact Points for this decision. Remaining: ${state.impactPointsRemaining}, needed: ${option.impactCost}.`);
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

    state.impactPointsRemaining -= option.impactCost;
    state.impactPointsSpent += option.impactCost;
    state.missionSpendById = state.missionSpendById || {};
    state.missionSpendById[mission.id] = option.impactCost;

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
        impactCost: option.impactCost
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
        }
        state.selectedMissionId = null;
        saveState(state);

        if (state.pipEnabled) {
          showPip();
          return;
        }

        navigate(allMissionsCompleted() ? 'complete' : 'map');
      });
    }
  }

  function bindGlobalEvents() {
    document.getElementById('btnDashboard').addEventListener('click', () => {
      dashboardContent.innerHTML = UI.renderDashboard(state);
      dashboardPanel.classList.remove('hidden');
      document.getElementById('btnDashboardClose').focus();
    });

    document.getElementById('btnDashboardClose').addEventListener('click', () => {
      dashboardPanel.classList.add('hidden');
    });

    document.getElementById('btnPipClose').addEventListener('click', () => {
      pipOverlay.classList.add('hidden');
      state.pipEnabled = false;
      saveState(state);
      navigate(allMissionsCompleted() ? 'complete' : 'map');
    });

    document.getElementById('btnReset').addEventListener('click', () => {
      const ok = window.confirm('Reset all progress for Tourism Explorer 9000?');
      if (!ok) return;
      state = clearState();
      if (missions.length) {
        state.missionOrder = missions.map(m => m.id);
        state.missionById = missions.reduce((acc, m) => {
          acc[m.id] = m;
          return acc;
        }, {});
      }
      saveState(state);
      computeAndStoreMetrics();
      navigate('map');
    });
  }

  function bindScreenEvents() {
    if (state.currentScreen === 'map') {
      mainEl.querySelectorAll('[data-mission-id]').forEach(btn => {
        btn.addEventListener('click', () => selectMission(btn.getAttribute('data-mission-id')));
      });
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
      mainEl.innerHTML = UI.renderMap(state, missions, SCORING_CONSTANTS);
    } else if (state.currentScreen === 'explore') {
      mainEl.innerHTML = UI.renderExploration(currentMission(), state);
    } else if (state.currentScreen === 'decision') {
      mainEl.innerHTML = UI.renderDecision(currentMission(), state);
    } else if (state.currentScreen === 'complete') {
      mainEl.innerHTML = UI.renderGameComplete(state);
    } else {
      state.currentScreen = 'map';
      mainEl.innerHTML = UI.renderMap(state, missions, SCORING_CONSTANTS);
    }

    bindScreenEvents();
    mainEl.focus();
  }

  async function start() {
    computeAndStoreMetrics();
    bindGlobalEvents();
    await loadMissionData();
    if (allMissionsCompleted()) {
      state.currentScreen = 'complete';
    }
    render();
  }

  start();
})();
