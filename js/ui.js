(function () {
  const CATEGORY_LABELS = {
    economic: 'Economic Capital',
    sustainability: 'Sustainability',
    culture: 'Cultural Inclusion',
    hospitality: 'Hospitality',
    satisfaction: 'Visitor Satisfaction'
  };

  const CATEGORY_ICONS = {
    economic: 'EC',
    sustainability: 'SU',
    culture: 'CI',
    hospitality: 'HO',
    satisfaction: 'VS'
  };

  const ROLE_CLASS = {
    recommended: 'good',
    challenge: 'warn',
    wildcard: 'bad'
  };

  const DISTRICT_BY_HUB = {
    Riverwalk: 'downtown-waterfront',
    ConventionDistrict: 'downtown-waterfront',
    PortTampa: 'downtown-waterfront',
    Channelside: 'beachfront-zone',
    Ybor: 'historic-ybor',
    BuschGardens: 'eco-park',
    SouthShore: 'eco-park',
    AirportCorridor: 'cultural-corridor'
  };

  const DISTRICT_LABELS = {
    'downtown-waterfront': 'Downtown Waterfront',
    'cultural-corridor': 'Cultural Corridor',
    'historic-ybor': 'Historic Ybor',
    'eco-park': 'Eco-Park',
    'beachfront-zone': 'Beachfront Zone'
  };

  const DISTRICT_STORYBOARD_ORDER = [
    'downtown-waterfront',
    'cultural-corridor',
    'historic-ybor',
    'eco-park',
    'beachfront-zone'
  ];

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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

  function getDistrictKey(mission) {
    return DISTRICT_BY_HUB[mission.hub] || 'historic-ybor';
  }

  function renderTokenDashboard(state) {
    const decisionDeltas = state.lastDecisionDeltas || null;

    function renderDeltaBadge(value) {
      if (typeof value !== 'number' || value === 0) return '';
      const deltaClass = value > 0 ? 'plus' : 'minus';
      const deltaLabel = value > 0 ? `+${value}` : `${value}`;
      return `<span class="token-delta-badge ${deltaClass}" aria-label="Recent change ${escapeHtml(deltaLabel)}">${escapeHtml(deltaLabel)}</span>`;
    }

    const tokenItems = Object.entries(state.categories)
      .map(([key, value]) => `
        <div class="token-chip">
          <span class="token-icon" aria-hidden="true">${CATEGORY_ICONS[key]}</span>
          <div class="token-metric">
            <span class="token-label">${CATEGORY_LABELS[key]}</span>
            <div class="token-value-row">
              <strong>${value}</strong>
              ${renderDeltaBadge(decisionDeltas?.[key])}
            </div>
          </div>
        </div>
      `)
      .join('');

    return `
      <section class="console-shell token-dashboard" aria-label="Tourism Token Dashboard">
        <div class="token-row">${tokenItems}</div>
        <div class="composite-score">
          <span>Tourism Composite Score (BII)</span>
          <strong>${state.BII}</strong>
          <small>${escapeHtml(state.ratingBand)}</small>
        </div>
      </section>
    `;
  }

  function renderMap(state, missions, constants, runConfig) {
    const highlightIds = new Set(state.highlightMissionIds || []);
    const districtCounts = {};

    const missionCards = missions.slice(0, 4).map(mission => {
      const role = state.offerSetRolesById?.[mission.id] || 'wildcard';
      const districtKey = getDistrictKey(mission);
      districtCounts[districtKey] = (districtCounts[districtKey] || 0) + 1;
      const stackIndex = districtCounts[districtKey] - 1;

      return `
        <article class="map-hotspot district-${districtKey} ${highlightIds.has(mission.id) ? 'highlighted' : ''}" style="--stack-index:${stackIndex};">
          <p class="district-label">${DISTRICT_LABELS[districtKey]}</p>
          <h3>${escapeHtml(mission.name)}</h3>
          <p class="small">${escapeHtml(mission.description)}</p>
          <div class="hotspot-meta">
            <span class="tag ${ROLE_CLASS[role] || 'warn'}">${escapeHtml(roleLabel(role))}</span>
            <span class="small">Hub: ${escapeHtml(mission.hub || mission.area || 'City Hub')}</span>
          </div>
          <button class="btn" data-mission-id="${escapeHtml(mission.id)}" aria-label="Enter ${escapeHtml(mission.name)}">Enter Mission</button>
        </article>
      `;
    }).join('');

    const pipIndicator = state.pipVoluntaryIndicator
      ? '<p class="tag warn">Pip has a coaching update on district balance.</p>'
      : '';

    const antiCheeseNudge = state.showPatternGamingNudge
      ? '<p class="tag warn">Options are shuffled each case—choose based on trade-offs, not the letter.</p>'
      : '';

    const districtLegendItems = DISTRICT_STORYBOARD_ORDER
      .map(districtKey => `
        <li class="district-legend-item">
          <span class="district-marker district-${districtKey}" aria-hidden="true"></span>
          <span>${escapeHtml(DISTRICT_LABELS[districtKey])}</span>
        </li>
      `)
      .join('');

    return `
      ${renderTokenDashboard(state)}
      <section class="console-shell card map-intro-card">
        <h2>City Map Hub</h2>
        ${renderRunProgress(state, runConfig.RUN_LENGTH)}
        <p><strong>Role:</strong> Newly hired Tourism Analyst for the City of Tampa.</p>
        <p>Select one mission from the current set, evaluate evidence, and manage system trade-offs.</p>
        <p><strong>Missions Complete:</strong> ${state.casesCompletedThisRun}/${runConfig.RUN_LENGTH}</p>
        ${pipIndicator}
        ${antiCheeseNudge}
        <div class="inline-actions">
          <button id="btnAskPipWhy" class="btn secondary">Ask Pip why these cases?</button>
        </div>
      </section>
      <section class="console-shell card budget-card">
        <h2>Impact Budget</h2>
        <p>You receive <strong>${constants.impactBudgetPerHotspot} Impact Points</strong> per mission. Decisions exceeding remaining budget are blocked.</p>
      </section>
      <section class="console-shell district-legend" aria-label="District legend">
        <h3>District Legend</h3>
        <ul>
          ${districtLegendItems}
        </ul>
      </section>
      <section class="console-shell city-map-board" aria-label="Tampa map hotspots">
        ${missionCards}
      </section>
    `;
  }

  function renderExploration(mission, state, runConfig) {
    const points = (mission.exploration.bullets || mission.exploration.dataPoints || [])
      .map(point => `<li>${escapeHtml(point)}</li>`)
      .join('');

    return `
      ${renderTokenDashboard(state)}
      <section class="console-shell card mission-briefing">
        <h2>Mission Briefing: ${escapeHtml(mission.name)}</h2>
        ${renderRunProgress(state, runConfig.RUN_LENGTH)}
        <p><strong>Impact Points Remaining:</strong> ${state.impactPointsRemaining}</p>
        <div class="grid two">
          <div class="brief-panel">
            <h3>Current Situation</h3>
            <p>${escapeHtml(mission.exploration.brief)}</p>
            <ul>${points}</ul>
          </div>
          <div class="media-placeholder" aria-label="Placeholder media panel">
            ${escapeHtml(mission.exploration.mediaLabel || 'Mission visual / source evidence panel')}
          </div>
        </div>
        <button id="btnToDecision" class="btn">Proceed to Decision</button>
      </section>
    `;
  }

  function renderImpactPills(deltas) {
    return Object.entries(deltas)
      .map(([key, value]) => `<span class="impact-pill ${value >= 0 ? 'plus' : 'minus'}">${CATEGORY_ICONS[key]} ${value > 0 ? '+' : ''}${value}</span>`)
      .join('');
  }

  function renderDecision(mission, state, runConfig, displayOptions = []) {
    const optionButtons = displayOptions
      .map(opt => {
        const optionCost = opt.cost ?? opt.impactCost;
        const afford = state.impactPointsRemaining >= optionCost;
        const displayTitle = stripOptionKeyPrefix(opt.title);
        return `
          <button class="btn choice ${afford ? '' : 'blocked'}" data-option-id="${escapeHtml(opt.displayLabel)}" aria-label="Select option ${escapeHtml(opt.displayLabel)}" ${afford ? '' : 'disabled'}>
            <span class="choice-head">
              <strong>${escapeHtml(opt.displayLabel)}) ${escapeHtml(displayTitle)}</strong>
              <span class="choice-cost">Cost ${optionCost}</span>
            </span>
            <span class="small">${escapeHtml(opt.description)}</span>
            <span class="impact-row">${renderImpactPills(opt.deltas || {})}</span>
            <span class="small">${afford ? `${state.impactPointsRemaining} points remaining before decision` : 'Insufficient budget'}</span>
          </button>
        `;
      })
      .join('');

    return `
      ${renderTokenDashboard(state)}
      <section class="console-shell card">
        <h2>Decision Point</h2>
        ${renderRunProgress(state, runConfig.RUN_LENGTH)}
        <p>Choose one strategy. Each option improves some categories while creating trade-offs.</p>
        <p><strong>Impact Points Remaining:</strong> ${state.impactPointsRemaining}</p>
        <div class="grid decision-grid">${optionButtons}</div>
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
      <section class="console-shell card feedback-card" tabindex="-1">
        <h2>Outcome Feedback</h2>
        <p>${escapeHtml(feedback.text)}</p>
        <p><strong>Learning note:</strong> ${escapeHtml(feedback.learningNote)}</p>
        <p><strong>System insight:</strong> ${escapeHtml(feedback.systemInsight)}</p>
        <p><strong>Trade-off spotlight:</strong> ${escapeHtml(feedback.tradeoffSpotlight)}</p>
        <ul class="delta-list">${deltaItems}</ul>
        <p><strong>Impact Cost:</strong> ${feedback.impactCost}</p>
        <p><strong>Remaining Impact Points:</strong> ${state.impactPointsRemaining}</p>
        <p><strong>Balance Check:</strong> Min category = ${state.minCategory}, variance = ${state.variance}</p>
        <p><strong>Poor outcome:</strong> ${feedback.poorOutcome ? 'Yes' : 'No'}</p>
        ${state.topGateLockReason ? `<p>Top Analyst currently blocked because: ${escapeHtml(state.topGateLockReason)}.</p>` : ''}
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
      <section class="card pip-card">
        <h3>Current Needs</h3>
        <p><strong>Lowest categories:</strong> ${escapeHtml(lowest)} (${diagnosis.minValue ?? state.minCategory})</p>
        <p><strong>Variance:</strong> ${diagnosis.variance}</p>
        <p><strong>Pitfall flags:</strong> ${escapeHtml(flags)}</p>
      </section>
    `;
  }

  function renderRemediationPlan(state, missionsById) {
    const diagnosis = state.diagnosis;
    const missionIds = diagnosis?.remediationMissions || [];
    if (!state.pipForceOpen || !missionIds.length) return '';

    const names = missionIds
      .map(id => missionsById[id]?.name || id)
      .map(name => `<li>${escapeHtml(name)}</li>`)
      .join('');

    return `
      <section class="card pip-card">
        <h3>Stabilize Next</h3>
        <p>After two poor outcomes, Pip suggests these stabilizing missions.</p>
        <ul>${names}</ul>
        <button id="btnHighlightMissions" class="btn secondary">Highlight these on map</button>
      </section>
    `;
  }

  function getPipState(state) {
    if (state.pipForceOpen) return 'warning';
    if (state.topGatePassed) return 'congrats';
    if (state.pipVoluntaryIndicator) return 'guidance';
    return 'inactive';
  }

  function renderPipPanel(state, explanation, missionsById) {
    const summaryBullets = (explanation?.summaryBullets || []).map(item => `<li>${escapeHtml(item)}</li>`).join('');
    const missionBlocks = (state.offerSetMissionIds || []).map(id => {
      const mission = missionsById[id];
      const role = roleLabel(state.offerSetRolesById?.[id] || 'wildcard');
      const bullets = (explanation?.perMissionBullets?.[id] || state.offerSetReasonsById?.[id] || [])
        .map(item => `<li>${escapeHtml(item)}</li>`)
        .join('');
      return `
        <section class="card pip-card">
          <h4>${escapeHtml(mission?.name || id)}</h4>
          <p><strong>${escapeHtml(role)}</strong></p>
          <ul>${bullets}</ul>
        </section>
      `;
    }).join('');

    const pipState = getPipState(state);

    return `
      <section class="pip-header state-${pipState}">
        <p class="small">Pip AI Assistant</p>
        <p><strong>Status:</strong> ${state.pipForceOpen ? 'Imbalance detected. Recovery coaching active.' : 'Advisory guidance available.'}</p>
      </section>
      <h3>Recommended because...</h3>
      <ul>${summaryBullets}</ul>
      <button id="btnPipWhyToggle" class="btn secondary" aria-expanded="${state.pipWhyExpanded ? 'true' : 'false'}" aria-controls="pipWhyDetails">Why am I seeing this?</button>
      <div id="pipWhyDetails" ${state.pipWhyExpanded ? '' : 'hidden'}>${missionBlocks}</div>
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
      ${renderTokenDashboard(state)}
      <section class="console-shell card report-card">
        <h2>Final Tourism Performance Report</h2>
        <p>You completed 8 cases in this run. Start a new run to generate a fresh sampling sequence.</p>
        <p class="end-rating">Analyst Tier: ${escapeHtml(state.ratingBand)}</p>
        <p><strong>Final Tourism Composite Score (BII):</strong> ${state.BII}</p>
        <p><strong>Variance:</strong> ${state.variance}</p>
        <p><strong>Narrative Summary:</strong> ${escapeHtml(state.finalNarrative)}</p>
        <h3>Final Badge Distribution</h3>
        <ul>${totals}</ul>
        <h3>Debrief</h3>
        <p>Use this report to reflect on category trade-offs, then replay to test an alternative balancing strategy.</p>
        <div class="inline-actions">
          <button id="btnBackMap" class="btn secondary">Review Map</button>
          <button class="btn" onclick="window.print()">Export Report</button>
        </div>
      </section>
    `;
  }

  function renderDashboard(state, runConfig) {
    const cat = state.categories;
    return `
      <section class="dashboard-modal-shell">
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
        <p><strong>Rating Band:</strong> ${escapeHtml(state.ratingBand)}</p>
        <p><strong>Min Category:</strong> ${state.minCategory}</p>
        <p><strong>Variance:</strong> ${state.variance}</p>
        <p><strong>Top Gate Passed:</strong> ${state.topGatePassed ? 'Yes' : 'No'}</p>
        ${state.topGatePassed ? '' : `<p><strong>Top Analyst Lock:</strong> ${escapeHtml(state.topGateLockReason)}</p>`}
        <p><strong>Poor Streak:</strong> ${state.poorStreak}</p>
        <p><strong>Decisions Made:</strong> ${state.decisionCount}</p>
        <p><strong>Total Impact Spent:</strong> ${state.impactPointsSpent}</p>
      </section>
    `;
  }

  window.TE9000UI = {
    renderMap,
    renderExploration,
    renderDecision,
    renderFeedback,
    renderPipPanel,
    renderGameComplete,
    renderDashboard,
    escapeHtml
  };
})();
