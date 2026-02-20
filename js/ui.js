(function () {
  const CATEGORY_LABELS = {
    economic: 'Economic Capital',
    sustainability: 'Sustainability',
    culture: 'Cultural Inclusion',
    hospitality: 'Hospitality',
    satisfaction: 'Visitor Satisfaction'
  };

  function renderMap(state, mission) {
    const lockText = state.hotspotPlayedCount >= 2
      ? '<span class="tag bad">Completed / Locked</span>'
      : state.hotspotPlayedCount === 1
        ? '<span class="tag warn">Replay Available (1)</span>'
        : '<span class="tag good">Available</span>';

    const intro = mission
      ? `<p><strong>Role:</strong> Newly hired Tourism Analyst for Tampa Areas of Economic Interest.</p>`
      : '<p>Loading mission data...</p>';

    return `
      <section class="card">
        <h2>City Map Hub</h2>
        ${intro}
        <p>Select a hotspot, evaluate evidence, and decide how to allocate constrained impact resources.</p>
      </section>
      <section class="map-hotspot" aria-label="Tampa map hotspot">
        <h3>${mission ? mission.name : 'Hotspot'} — ${mission ? mission.area : ''}</h3>
        <p>${mission ? mission.description : ''}</p>
        <p>${lockText}</p>
        <button id="btnEnterHotspot" class="btn" ${state.hotspotPlayedCount >= 2 ? 'disabled' : ''}>
          ${state.hotspotPlayedCount === 1 ? 'Replay Hotspot' : 'Enter Hotspot'}
        </button>
      </section>
    `;
  }

  function renderExploration(mission) {
    const points = mission.exploration.dataPoints
      .map(point => `<li>${point}</li>`)
      .join('');

    return `
      <section class="card">
        <h2>Exploration: ${mission.name}</h2>
        <div class="grid two">
          <div>
            <p>${mission.exploration.brief}</p>
            <ul>
              ${points}
            </ul>
          </div>
          <div class="media-placeholder" aria-label="Placeholder media panel">
            Placeholder media panel (image/video)
          </div>
        </div>
        <button id="btnToDecision" class="btn">Proceed to Decision</button>
      </section>
    `;
  }

  function renderDecision(mission) {
    const optionButtons = mission.options
      .map(opt => `
        <button class="btn choice" data-option-id="${opt.id}" aria-label="Select option ${opt.id}">
          <strong>${opt.title}</strong><br />
          <span class="small">${opt.description}</span>
        </button>
      `)
      .join('');

    return `
      <section class="card">
        <h2>Decision Point</h2>
        <p>Choose one strategy. Each choice improves some outcomes while creating trade-offs.</p>
        <div class="grid">
          ${optionButtons}
        </div>
      </section>
      <section id="feedbackContainer"></section>
    `;
  }

  function deltaText(delta) {
    if (delta > 0) return `+${delta}`;
    return `${delta}`;
  }

  function renderFeedback(feedback) {
    const deltaItems = Object.entries(feedback.deltas)
      .map(([key, value]) => `<li>${CATEGORY_LABELS[key]}: <strong>${deltaText(value)}</strong></li>`)
      .join('');

    return `
      <section class="card" tabindex="-1">
        <h2>Outcome Feedback</h2>
        <p>${feedback.text}</p>
        <ul class="delta-list">${deltaItems}</ul>
        <p><strong>Poor outcome:</strong> ${feedback.poorOutcome ? 'Yes' : 'No'}</p>
        <button id="btnReturnMap" class="btn">Return to Map</button>
      </section>
    `;
  }

  function renderEndScreen(state) {
    const gateText = state.topGatePassed
      ? 'Top-rating gate passed: all category minimum and variance constraints met.'
      : 'Top-rating gate not passed: rebalance low categories and reduce variance spread.';

    return `
      <section class="card">
        <h2>Mission Complete</h2>
        <p>You have completed the vertical slice (play + one replay).</p>
        <p class="end-rating">Final rating: ${state.ratingBand}</p>
        <p><strong>Balanced Impact Index (BII):</strong> ${state.BII}</p>
        <p><strong>Variance:</strong> ${state.variance}</p>
        <p>${gateText}</p>
        <button id="btnBackMap" class="btn secondary">Review Map</button>
      </section>
    `;
  }

  function renderDashboard(state) {
    const cat = state.categories;
    return `
      <div class="kpi-row">
        <div class="kpi"><h3>Economic Capital</h3><div class="value">${cat.economic}</div></div>
        <div class="kpi"><h3>Sustainability</h3><div class="value">${cat.sustainability}</div></div>
        <div class="kpi"><h3>Cultural Inclusion</h3><div class="value">${cat.culture}</div></div>
        <div class="kpi"><h3>Hospitality</h3><div class="value">${cat.hospitality}</div></div>
        <div class="kpi"><h3>Visitor Satisfaction</h3><div class="value">${cat.satisfaction}</div></div>
      </div>
      <hr />
      <p><strong>Balanced Impact Index (BII):</strong> ${state.BII}</p>
      <p><strong>Rating Band:</strong> ${state.ratingBand}</p>
      <p><strong>Top Gate Passed:</strong> ${state.topGatePassed ? 'Yes' : 'No'}</p>
      <p><strong>Poor Streak:</strong> ${state.poorStreak}</p>
      <p><strong>Decisions Made:</strong> ${state.decisionCount}</p>
    `;
  }

  window.TE9000UI = {
    renderMap,
    renderExploration,
    renderDecision,
    renderFeedback,
    renderEndScreen,
    renderDashboard
  };
})();
