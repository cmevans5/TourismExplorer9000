(function () {
  const mainEl = document.getElementById('mainContent');
  const dashboardPanel = document.getElementById('dashboardPanel');
  const dashboardContent = document.getElementById('dashboardContent');
  const pipOverlay = document.getElementById('pipOverlay');
  const pipHintText = document.getElementById('pipHintText');

  const { SCORING_CONSTANTS, computeBII, computeVariance, checkTopGate, classifyRating } = window.TE9000Scoring;
  const { saveState, loadState, clearState } = window.TE9000State;
  const UI = window.TE9000UI;

  let state = loadState();
  let mission = null;

  function loadMissionData() {
    return fetch('data/missions.json')
      .then(resp => {
        if (!resp.ok) throw new Error('Could not load missions.json');
        return resp.json();
      })
      .then(data => {
        mission = data.missions[0];
        state.missionId = mission.id;
        state.missionData = mission;
        saveState(state);
      })
      .catch(err => {
        mainEl.innerHTML = `<section class="card"><h2>Load Error</h2><p>${err.message}</p><p class="small">Tip: run from a local server, not file://.</p></section>`;
      });
  }

  function navigate(screen) {
    state.currentScreen = screen;
    saveState(state);
    render();
  }

  function computeAndStoreMetrics() {
    const result = computeBII(state.categories, SCORING_CONSTANTS);
    state.BII = Math.round(result.BII);
    state.variance = computeVariance(state.categories);
    state.topGatePassed = checkTopGate(state.categories, state.variance, SCORING_CONSTANTS);
    state.ratingBand = classifyRating(state.BII, state.topGatePassed, SCORING_CONSTANTS);
  }

  // Poor outcome definition implemented consistently across app:
  // poor outcome = net delta sum < 0.
  function evaluatePoorOutcome(deltas) {
    const net = Object.values(deltas).reduce((acc, n) => acc + n, 0);
    return net < 0;
  }

  function applyDecision(optionId) {
    if (!mission) return;
    const option = mission.options.find(o => o.id === optionId);
    if (!option) return;

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

    state.lastDecisionDeltas = deltas;
    state.decisionCount += 1;
    if (optionId === 'B') state.correctCount += 1;

    const poorOutcome = evaluatePoorOutcome(deltas);
    state.poorStreak = poorOutcome ? state.poorStreak + 1 : 0;
    state.pipEnabled = state.poorStreak >= 2;

    computeAndStoreMetrics();
    saveState(state);

    const feedbackHtml = UI.renderFeedback({
      text: option.feedback,
      deltas,
      poorOutcome
    });

    document.getElementById('feedbackContainer').innerHTML = feedbackHtml;
    const feedbackCard = document.querySelector('#feedbackContainer section');
    if (feedbackCard) feedbackCard.focus();

    const returnBtn = document.getElementById('btnReturnMap');
    if (returnBtn) {
      returnBtn.addEventListener('click', () => {
        state.hotspotPlayedCount += 1;
        state.hotspotCompleted = state.hotspotPlayedCount >= 1;
        const ended = state.hotspotPlayedCount >= 2;
        saveState(state);
        if (state.pipEnabled) {
          showPip();
        } else {
          navigate(ended ? 'end' : 'map');
        }
      });
    }
  }

  function showPip() {
    const lowCategory = Object.entries(state.categories).sort((a, b) => a[1] - b[1])[0];
    const lowLabelMap = {
      economic: 'Economic Capital',
      sustainability: 'Sustainability',
      culture: 'Cultural Inclusion',
      hospitality: 'Hospitality',
      satisfaction: 'Visitor Satisfaction'
    };
    pipHintText.textContent = `Focus next action on ${lowLabelMap[lowCategory[0]]}. Pair gains in one category with protection for your weakest category to reduce imbalance.`;
    pipOverlay.classList.remove('hidden');
    document.getElementById('btnPipClose').focus();
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
      navigate(state.hotspotPlayedCount >= 2 ? 'end' : 'map');
    });

    document.getElementById('btnReset').addEventListener('click', () => {
      const ok = window.confirm('Reset all progress for Tourism Explorer 9000?');
      if (!ok) return;
      state = clearState();
      if (mission) {
        state.missionId = mission.id;
        state.missionData = mission;
      }
      saveState(state);
      computeAndStoreMetrics();
      navigate('map');
    });
  }

  function bindScreenEvents() {
    if (state.currentScreen === 'map') {
      const enter = document.getElementById('btnEnterHotspot');
      if (enter) enter.addEventListener('click', () => navigate('explore'));
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

    if (state.currentScreen === 'end') {
      const back = document.getElementById('btnBackMap');
      if (back) back.addEventListener('click', () => navigate('map'));
    }
  }

  function render() {
    if (!mission) {
      mainEl.innerHTML = '<section class="card"><h2>Loading…</h2></section>';
      return;
    }

    if (state.currentScreen === 'map') {
      mainEl.innerHTML = UI.renderMap(state, mission);
    } else if (state.currentScreen === 'explore') {
      mainEl.innerHTML = UI.renderExploration(mission);
    } else if (state.currentScreen === 'decision') {
      mainEl.innerHTML = UI.renderDecision(mission);
    } else if (state.currentScreen === 'end') {
      mainEl.innerHTML = UI.renderEndScreen(state);
    } else {
      state.currentScreen = 'map';
      mainEl.innerHTML = UI.renderMap(state, mission);
    }

    bindScreenEvents();
    mainEl.focus();
  }

  async function start() {
    computeAndStoreMetrics();
    bindGlobalEvents();
    await loadMissionData();
    render();
  }

  start();
})();
