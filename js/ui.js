(function () {
  const CATEGORY_LABELS = {
    economic: 'Economic Capital',
    sustainability: 'Sustainability',
    culture: 'Cultural Inclusion',
    hospitality: 'Hospitality',
    satisfaction: 'Visitor Satisfaction'
  };

  const ROLE_CLASS = {
    recommended: 'good',
    challenge: 'warn',
    wildcard: 'bad'
  };

  function toCategoryLabel(key) {
    return CATEGORY_LABELS[key] || key;
  }

  function roleLabel(role) {
    return role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : 'Wildcard';
  }

  function stripOptionKeyPrefix(text) {
    return String(text || '')
      .replace(/^(\s*[A-C][\)\.]\s*)+/i, '')
      .replace(/^(\s*[A-C]\s*[:.-]\s*)+/i, '')
      .trim();
  }

  function renderRunProgress(state, runLength) {
    const caseNumber = Math.min(state.casesCompletedThisRun + 1, runLength);
    return `<p class="sampling-progress"><strong>Tourism Sampling:</strong> Case ${caseNumber}/${runLength}</p>`;
  }

  function renderMap(state, missions, constants, runConfig) {
    const highlightIds = new Set(state.highlightMissionIds || []);
    const missionCards = missions.slice(0, 4).map(mission => {
      const role = state.offerSetRolesById?.[mission.id] || 'wildcard';
      const roleTag = `<span class="tag ${ROLE_CLASS[role] || 'warn'}">${roleLabel(role)}</span>`;

      return `
        <article class="map-hotspot ${highlightIds.has(mission.id) ? 'highlighted' : ''}">
          <h3>${mission.name} — ${mission.hub || mission.area || 'City Hub'}</h3>
          <p>${mission.description}</p>
          <p>${roleTag}</p>
          <button class="btn" data-mission-id="${mission.id}" aria-label="Enter ${mission.name}">Enter Hotspot</button>
        </article>
      `;
    }).join('');

    const pipIndicator = state.pipVoluntaryIndicator
      ? '<p class="tag warn">Pip has an update based on your current gate status.</p>'
      : '';

    const antiCheeseNudge = state.showPatternGamingNudge
      ? '<p class="tag warn">Options are shuffled each case—choose based on trade-offs, not the letter.</p>'
      : '';

    return `
      <section class="card">
        <h2>City Map Hub</h2>
        ${renderRunProgress(state, runConfig.RUN_LENGTH)}
        <p><strong>Role:</strong> Newly hired Tourism Analyst for Tampa Areas of Economic Interest.</p>
        <p>Select one of this step's four offered missions, then return for the next offer set.</p>
        <p><strong>Missions Complete:</strong> ${state.casesCompletedThisRun}/${runConfig.RUN_LENGTH}</p>
        ${pipIndicator}
        ${antiCheeseNudge}
        <div class="inline-actions">
          <button id="btnAskPipWhy" class="btn secondary">Ask Pip why these cases?</button>
        </div>
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

  function renderExploration(mission, state, runConfig) {
    const points = (mission.exploration.bullets || mission.exploration.dataPoints || [])
      .map(point => `<li>${point}</li>`)
      .join('');

    return `
      <section class="card">
        <h2>Exploration: ${mission.name}</h2>
        ${renderRunProgress(state, runConfig.RUN_LENGTH)}
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

  function renderDecision(mission, state, runConfig, displayOptions = []) {
    const optionButtons = displayOptions
      .map(opt => {
        const optionCost = opt.cost ?? opt.impactCost;
        const afford = state.impactPointsRemaining >= optionCost;
        const displayTitle = stripOptionKeyPrefix(opt.title);
        return `
          <button class="btn choice ${afford ? '' : 'blocked'}" data-option-id="${opt.displayLabel}" aria-label="Select option ${opt.displayLabel}" ${afford ? '' : 'disabled'}>
            <strong>${opt.displayLabel}) ${displayTitle}</strong><br />
            <span class="small">${opt.description}</span><br />
            <span class="small">Impact Cost: ${optionCost} (${afford ? `${state.impactPointsRemaining} remaining` : 'Insufficient budget'})</span>
          </button>
        `;
      })
      .join('');

    return `
      <section class="card">
        <h2>Decision Point</h2>
        ${renderRunProgress(state, runConfig.RUN_LENGTH)}
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
        <p><strong>Learning note:</strong> ${feedback.learningNote}</p>
        <p><strong>System insight:</strong> ${feedback.systemInsight}</p>
        <p><strong>Trade-off Spotlight:</strong> ${feedback.tradeoffSpotlight}</p>
        <ul class="delta-list">${deltaItems}</ul>
        <p><strong>Impact Cost:</strong> ${feedback.impactCost}</p>
        <p><strong>Remaining Impact Points:</strong> ${state.impactPointsRemaining}</p>
        <p><strong>Balance Check:</strong> Min category = ${state.minCategory}, variance = ${state.variance}</p>
        <p><strong>Poor outcome:</strong> ${feedback.poorOutcome ? 'Yes' : 'No'}</p>
        ${state.topGateLockReason ? `<p>Top Analyst currently blocked because: ${state.topGateLockReason}.</p>` : ''}
        <button id="btnReturnMap" class="btn">Return to Map</button>
      </section>
    `;
  }

  function renderDiagnosis(state) {
    const diagnosis = state.diagnosis;
    if (!diagnosis) return '<p class="small">Pip is collecting more decisions before giving a diagnosis.</p>';

    const lowest = (diagnosis.lowestCategories || []).map(toCategoryLabel).join(', ');
    const flags = diagnosis.flags?.length ? diagnosis.flags.join(', ') : 'None currently detected';

    return `
      <section class="card">
        <h3>Current Needs</h3>
        <p><strong>Lowest categories:</strong> ${lowest} (${diagnosis.minValue ?? state.minCategory})</p>
        <p><strong>Variance:</strong> ${diagnosis.variance}</p>
        <p><strong>Pitfall flags:</strong> ${flags}</p>
      </section>
    `;
  }

  function renderRemediationPlan(state, missionsById) {
    const diagnosis = state.diagnosis;
    const missionIds = diagnosis?.remediationMissions || [];
    if (!state.pipForceOpen || !missionIds.length) return '';

    const names = missionIds
      .map(id => missionsById[id]?.name || id)
      .map(name => `<li>${name}</li>`)
      .join('');

    return `
      <section class="card">
        <h3>Stabilize Next</h3>
        <p>After two poor outcomes, Pip suggests these stabilizing missions.</p>
        <ul>${names}</ul>
        <button id="btnHighlightMissions" class="btn secondary">Highlight these on map</button>
      </section>
    `;
  }

  function renderPipPanel(state, explanation, missionsById) {
    const summaryBullets = (explanation?.summaryBullets || []).map(item => `<li>${item}</li>`).join('');
    const missionBlocks = (state.offerSetMissionIds || []).map(id => {
      const mission = missionsById[id];
      const role = roleLabel(state.offerSetRolesById?.[id] || 'wildcard');
      const bullets = (explanation?.perMissionBullets?.[id] || state.offerSetReasonsById?.[id] || [])
        .map(item => `<li>${item}</li>`)
        .join('');
      return `
        <section class="card">
          <h4>${mission?.name || id}</h4>
          <p><strong>${role}</strong></p>
          <ul>${bullets}</ul>
        </section>
      `;
    }).join('');

    return `
      <p><strong>Pattern detected:</strong> ${state.pipForceOpen ? 'two consecutive poor outcomes.' : 'adaptive coaching update available.'}</p>
      <h3>Recommended because...</h3>
      <ul>${summaryBullets}</ul>
      <button id="btnPipWhyToggle" class="btn secondary" aria-expanded="${state.pipWhyExpanded ? 'true' : 'false'}" aria-controls="pipWhyDetails">Why am I seeing this?</button>
      <div id="pipWhyDetails" ${state.pipWhyExpanded ? '' : 'hidden'}>
        ${missionBlocks}
      </div>
      ${renderDiagnosis(state)}
      ${renderRemediationPlan(state, missionsById)}
      <button id="btnPipClose" class="btn">Continue</button>
    `;
  }

  function renderGameComplete(state) {
    const totals = Object.entries(state.categories)
      .map(([key, value]) => `<li>${CATEGORY_LABELS[key]}: <strong>${value}</strong></li>`)
      .join('');

    return `
      <section class="card">
        <h2>Game Complete</h2>
        <p>You completed 8 cases in this run. Start a new run to get a fresh sequence of offer sets.</p>
        <p class="end-rating">Analyst Tier: ${state.ratingBand}</p>
        <p><strong>Final BII:</strong> ${state.BII}</p>
        <p><strong>Variance:</strong> ${state.variance}</p>
        <p><strong>Narrative Summary:</strong> ${state.finalNarrative}</p>
        <ul>${totals}</ul>
        <button id="btnBackMap" class="btn secondary">Review Map</button>
      </section>
    `;
  }

  function renderDashboard(state, runConfig) {
    const cat = state.categories;
    return `
      <p><strong>Tourism Sampling:</strong> Case ${Math.min(state.casesCompletedThisRun + 1, runConfig.RUN_LENGTH)}/${runConfig.RUN_LENGTH}</p>
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
      <p><strong>Min Category:</strong> ${state.minCategory}</p>
      <p><strong>Variance:</strong> ${state.variance}</p>
      <p><strong>Top Gate Passed:</strong> ${state.topGatePassed ? 'Yes' : 'No'}</p>
      ${state.topGatePassed ? '' : `<p><strong>Top Analyst Lock:</strong> ${state.topGateLockReason}</p>`}
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
    renderPipPanel,
    renderGameComplete,
    renderDashboard
  };
})();
