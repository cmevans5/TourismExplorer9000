(function () {
  const CATEGORY_LABELS = {
    economic: 'Economic Capital',
    sustainability: 'Sustainability',
    culture: 'Cultural Inclusion',
    hospitality: 'Hospitality',
    satisfaction: 'Visitor Satisfaction'
  };

  function renderMap(state, missions, constants) {
    const missionCards = missions.map(mission => {
      const completed = state.completedMissionIds.includes(mission.id);
      const status = completed
        ? '<span class="tag good">Completed</span>'
        : '<span class="tag warn">Available</span>';

      return `
        <article class="map-hotspot">
          <h3>${mission.name} — ${mission.area}</h3>
          <p>${mission.description}</p>
          <p>${status}</p>
          <button
            class="btn"
            data-mission-id="${mission.id}"
            ${completed ? 'disabled' : ''}
            aria-label="${completed ? `${mission.name} completed` : `Enter ${mission.name}`}">
            ${completed ? 'Completed' : 'Enter Hotspot'}
          </button>
        </article>
      `;
    }).join('');

    return `
      <section class="card">
        <h2>City Map Hub</h2>
        <p><strong>Role:</strong> Newly hired Tourism Analyst for Tampa Areas of Economic Interest.</p>
        <p>Select a hotspot, evaluate evidence, and decide how to allocate constrained impact resources.</p>
        <p><strong>Missions Complete:</strong> ${state.completedMissionIds.length}/${missions.length}</p>
      </section>
      <section class="card">
        <h2>Impact Budget</h2>
        <p>You receive <strong>${constants.impactBudgetPerHotspot} Impact Points</strong> per hotspot. Decisions that exceed the remaining budget are blocked.</p>
      </section>
      <section class="grid map-grid" aria-label="Tampa map hotspots">
        ${missionCards}
      </section>
    `;
  }

  function renderExploration(mission, state) {
    const points = mission.exploration.dataPoints
      .map(point => `<li>${point}</li>`)
      .join('');

    return `
      <section class="card">
        <h2>Exploration: ${mission.name}</h2>
        <p><strong>Impact Points Remaining:</strong> ${state.impactPointsRemaining}</p>
        <div class="grid two">
          <div>
            <p>${mission.exploration.brief}</p>
            <ul>
              ${points}
            </ul>
          </div>
          <div class="media-placeholder" aria-label="Placeholder media panel">
            ${mission.exploration.mediaLabel || 'Placeholder media panel (image/video)'}
          </div>
        </div>
        <button id="btnToDecision" class="btn">Proceed to Decision</button>
      </section>
    `;
  }

  function renderDecision(mission, state) {
    const optionButtons = mission.options
      .map(opt => {
        const afford = state.impactPointsRemaining >= opt.impactCost;
        return `
          <button class="btn choice ${afford ? '' : 'blocked'}" data-option-id="${opt.id}" aria-label="Select option ${opt.id}" ${afford ? '' : 'disabled'}>
            <strong>${opt.title}</strong><br />
            <span class="small">${opt.description}</span><br />
            <span class="small">Impact Cost: ${opt.impactCost} (${afford ? `${state.impactPointsRemaining} remaining` : 'Insufficient budget'})</span>
          </button>
        `;
      })
      .join('');

    return `
      <section class="card">
        <h2>Decision Point</h2>
        <p>Choose one strategy. Each choice improves some outcomes while creating trade-offs.</p>
        <p><strong>Impact Points Remaining:</strong> ${state.impactPointsRemaining}</p>
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

  function renderFeedback(feedback, state) {
    const deltaItems = Object.entries(feedback.deltas)
      .map(([key, value]) => `<li>${CATEGORY_LABELS[key]}: <strong>${deltaText(value)}</strong></li>`)
      .join('');

    return `
      <section class="card" tabindex="-1">
        <h2>Outcome Feedback</h2>
        <p>${feedback.text}</p>
        <ul class="delta-list">${deltaItems}</ul>
        <p><strong>Impact Cost:</strong> ${feedback.impactCost}</p>
        <p><strong>Remaining Impact Points:</strong> ${state.impactPointsRemaining}</p>
        <p><strong>Poor outcome:</strong> ${feedback.poorOutcome ? 'Yes' : 'No'}</p>
        <button id="btnReturnMap" class="btn">Return to Map</button>
      </section>
    `;
  }

  function renderGameComplete(state) {
    const totals = Object.entries(state.categories)
      .map(([key, value]) => `<li>${CATEGORY_LABELS[key]}: <strong>${value}</strong></li>`)
      .join('');

    return `
      <section class="card">
        <h2>Game Complete</h2>
        <p>All hotspots have been completed. Final tourism systems report is now available.</p>
        <p class="end-rating">Analyst Tier: ${state.ratingBand}</p>
        <p><strong>Final BII:</strong> ${state.BII}</p>
        <p><strong>Variance:</strong> ${state.variance}</p>
        <p><strong>Narrative Summary:</strong> ${state.finalNarrative}</p>
        <ul>${totals}</ul>
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
      <p><strong>Total Impact Spent:</strong> ${state.impactPointsSpent}</p>
    `;
  }

  window.TE9000UI = {
    renderMap,
    renderExploration,
    renderDecision,
    renderFeedback,
    renderGameComplete,
    renderDashboard
  };
})();
