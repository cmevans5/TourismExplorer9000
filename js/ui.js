(function () {
  const CATEGORY_LABELS = {
    economic: 'Destination Economics',
    sustainability: 'Environmental Sustainability',
    culture: 'Community and Cultural Stewardship',
    hospitality: 'Hospitality and Service Quality',
    satisfaction: 'Visitor Experience'
  };

  const CATEGORY_ICONS = {
    economic: 'EC',
    sustainability: 'SU',
    culture: 'CU',
    hospitality: 'HQ',
    satisfaction: 'VX'
  };

  const DISTRICT_BY_HUB = {
    Riverwalk: 'downtown-waterfront',
    PortTampa: 'downtown-waterfront',
    Ybor: 'historic-ybor',
    BuschGardens: 'eco-park'
  };

  const DISTRICT_LABELS = {
    'downtown-waterfront': 'Downtown Waterfront',
    'historic-ybor': 'Historic Ybor',
    'eco-park': 'Eco-Park'
  };

  const ROLE_LABELS = {
    current: 'Current Case',
    next: 'Up Next',
    later: 'Later Case'
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getDistrictKey(mission) {
    return DISTRICT_BY_HUB[mission?.hub] || 'historic-ybor';
  }

  function stripOptionKeyPrefix(text) {
    return String(text || '').replace(/^(\s*[A-C][\)\.:\-]\s*)+/i, '').trim();
  }

  function renderTokenDashboard(state) {
    const tokenItems = Object.entries(state.categories || {}).map(([key, value]) => `
      <div class="token-chip">
        <span class="token-icon" aria-hidden="true">${CATEGORY_ICONS[key]}</span>
        <div class="token-metric">
          <span class="token-label">${escapeHtml(CATEGORY_LABELS[key])}</span>
          <div class="token-value-row"><strong>${escapeHtml(value)}</strong></div>
        </div>
      </div>
    `).join('');

    return `
      <section class="console-shell token-dashboard" aria-label="Destination and learning dashboard">
        <div class="token-row">${tokenItems}</div>
        <div class="composite-score">
          <span>Destination Balance Index</span>
          <strong>${escapeHtml(state.BII)}</strong>
          <small>${escapeHtml(state.ratingBand)}</small>
          <small>Learning Evidence ${escapeHtml(state.learningScore)}/${Math.max(state.decisionCount * 3, 1)}</small>
          <small>Goal: keep the system balanced across all five categories.</small>
        </div>
      </section>
    `;
  }

  function renderRunProgress(state, runLength) {
    return `<p class="sampling-progress"><strong>Academic Prototype:</strong> Case ${Math.min(state.casesCompletedThisRun + 1, runLength)}/${runLength}</p>`;
  }

  function renderMap(state, missions, _constants, runConfig) {
    const selectedMission = missions.find((mission) => mission.id === state.selectedHotspotId) || missions[0] || null;
    const highlightIds = new Set(state.highlightMissionIds || []);
    const queueCards = missions.map((mission, index) => {
      const role = state.offerSetRolesById?.[mission.id] || 'later';
      const districtKey = getDistrictKey(mission);
      const isSelected = selectedMission?.id === mission.id;
      const isCompleted = (state.completedMissionIds || []).includes(mission.id);
      const summaryEvidence = mission.evidence?.[0]?.detail || mission.description;
      return `
        <button
          type="button"
          class="mission-queue-card ${isSelected ? 'is-selected' : ''} ${highlightIds.has(mission.id) ? 'highlighted' : ''}"
          data-hotspot-id="${escapeHtml(mission.id)}"
          aria-pressed="${isSelected ? 'true' : 'false'}"
        >
          <div class="mission-queue-head">
            <span class="district-label">${escapeHtml(DISTRICT_LABELS[districtKey] || 'Tampa District')}</span>
            <span class="tag ${role === 'current' ? 'good' : 'warn'} marker-role">${escapeHtml(ROLE_LABELS[role] || 'Case')}</span>
          </div>
          <strong class="mission-queue-title">${escapeHtml(mission.name)}</strong>
          <p class="mission-queue-domain">${escapeHtml(mission.tourismDomain)}</p>
          <p class="mission-queue-summary">${escapeHtml(summaryEvidence)}</p>
          <div class="mission-queue-footer">
            <span class="district-marker district-${districtKey}" aria-hidden="true"></span>
            <span>${isCompleted ? 'Completed' : `Case ${index + 1} of ${runConfig.RUN_LENGTH}`}</span>
          </div>
        </button>
      `;
    }).join('');

    const selectedStakeholders = (selectedMission?.stakeholders || [])
      .slice(0, 3)
      .map((stakeholder) => `<li>${escapeHtml(stakeholder.label)}: ${escapeHtml(stakeholder.perspective)}</li>`)
      .join('');
    const selectedEvidence = (selectedMission?.evidence || [])
      .map((item) => `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.detail)}</li>`)
      .join('');
    const selectedConstraints = (selectedMission?.constraints || [])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('');
    const completed = new Set(state.completedMissionIds || []);
    const selectedRole = selectedMission ? (state.offerSetRolesById?.[selectedMission.id] || 'later') : null;

    return `
      ${renderTokenDashboard(state)}
      <section class="console-shell card map-intro-card">
        <p class="district-label">Tampa Tourism Learning Studio</p>
        <h2>Junior Destination Strategy Analyst</h2>
        ${renderRunProgress(state, runConfig.RUN_LENGTH)}
        <p class="intro-lead">Interpret tourism data, weigh stakeholder trade-offs, and defend balanced planning decisions across four Tampa destination cases.</p>
        ${selectedMission ? `
          <section class="summary-card map-start-card">
            <p class="district-label">Selected Case</p>
            <h3>${escapeHtml(selectedMission.name)}</h3>
            <p class="small">${escapeHtml(selectedMission.tourismDomain)}</p>
            <div class="inline-actions">
              <button type="button" id="btnStartSelectedCase" class="btn">${completed.has(selectedMission.id) ? 'Review Completed Case' : 'Start Selected Case'}</button>
              <span class="tag ${selectedRole === 'current' ? 'good' : 'warn'}">${escapeHtml(ROLE_LABELS[selectedRole] || 'Case')}</span>
            </div>
          </section>
        ` : ''}
        <div class="inline-actions">
          <button type="button" id="btnAskPipWhy" class="btn secondary">Ask Pip for Coaching</button>
        </div>
      </section>
      <section class="map-stage">
        <aside class="card map-zone-status">
          <h3>Session Goals</h3>
          <ul class="stakeholder-list">
            <li>Make destination decisions that balance visitors, residents, and operators.</li>
            <li>Cite evidence before choosing a strategy.</li>
            <li>Use reflection to explain what your decision improves and what it risks.</li>
          </ul>
          <p class="small"><strong>Completed cases:</strong> ${escapeHtml(state.casesCompletedThisRun)}/${escapeHtml(runConfig.RUN_LENGTH)}</p>
          <p class="small"><strong>Learning evidence logged:</strong> ${escapeHtml(state.learningEvidenceUsedCount)}</p>
        </aside>
        <section class="card mission-queue-panel map-zone-play">
          <div class="mission-queue-header">
            <div>
              <p class="district-label">Case Queue</p>
              <h3>Choose the next destination case</h3>
            </div>
            <p class="small">Select a case to preview it, then open the briefing to start play.</p>
          </div>
          <div class="mission-queue-grid">
            ${queueCards || '<p>No cases remaining.</p>'}
          </div>
        </section>
        <aside class="card map-mission-detail map-zone-selected">
          ${selectedMission ? `
            <p class="district-label">${escapeHtml(DISTRICT_LABELS[getDistrictKey(selectedMission)] || 'Tampa District')}</p>
            <h3>${escapeHtml(selectedMission.name)}</h3>
            <p class="mission-objective"><strong>Tourism domain:</strong> ${escapeHtml(selectedMission.tourismDomain)}</p>
            <div class="inline-actions">
              <button type="button" id="btnOpenBriefing" class="btn" ${completed.has(selectedMission.id) ? 'disabled' : ''}>${completed.has(selectedMission.id) ? 'Completed' : 'Open Briefing'}</button>
            </div>
            <p>${escapeHtml(selectedMission.description)}</p>
            <details class="mission-detail-drawer" open>
              <summary>Priority stakeholders</summary>
              <div class="mission-detail-content"><ul class="stakeholder-list">${selectedStakeholders}</ul></div>
            </details>
            <details class="mission-detail-drawer">
              <summary>Evidence to notice</summary>
              <div class="mission-detail-content"><ul class="stakeholder-list">${selectedEvidence}</ul></div>
            </details>
            <details class="mission-detail-drawer">
              <summary>Operational constraints</summary>
              <div class="mission-detail-content"><ul class="stakeholder-list">${selectedConstraints}</ul></div>
            </details>
            <p class="small">Select a different case from the queue at any time before opening the briefing.</p>
          ` : '<p>No cases currently available.</p>'}
        </aside>
      </section>
    `;
  }

  function renderExploration(mission, state, runConfig) {
    const stakeholders = (mission.stakeholders || []).map((stakeholder) => `
      <article class="summary-card">
        <h4>${escapeHtml(stakeholder.label)}</h4>
        <p>${escapeHtml(stakeholder.perspective)}</p>
      </article>
    `).join('');
    const evidence = (mission.evidence || []).map((item) => `
      <article class="summary-card">
        <h4>${escapeHtml(item.label)}</h4>
        <p>${escapeHtml(item.detail)}</p>
      </article>
    `).join('');
    const constraints = (mission.constraints || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');

    return `
      ${renderTokenDashboard(state)}
      <section class="console-shell card mission-briefing">
        <h2>${escapeHtml(mission.name)}</h2>
        ${renderRunProgress(state, runConfig.RUN_LENGTH)}
        <p class="pedagogy-objective"><strong>Learning objectives:</strong> ${escapeHtml(mission.learningObjectives.join(' '))}</p>
        <p>${escapeHtml(mission.exploration?.brief || mission.description)}</p>
        <div class="summary-grid">
          ${evidence}
        </div>
        <h3>Stakeholder perspectives</h3>
        <div class="summary-grid">${stakeholders}</div>
        <h3>Constraints</h3>
        <ul class="stakeholder-list">${constraints}</ul>
        <div class="inline-actions">
          <button type="button" id="btnBackMap" class="btn secondary">Back to Map</button>
          <button type="button" id="btnToDecision" class="btn">Move to Decision and Rationale</button>
        </div>
      </section>
    `;
  }

  function renderOptionCards(displayOptions, state) {
    return displayOptions.map((option) => {
      const cost = option.cost ?? option.impactCost;
      const disabled = state.impactPointsRemaining < cost;
      const deltas = Object.entries(option.deltas || {})
        .map(([key, value]) => `<span class="impact-pill ${value >= 0 ? 'plus' : 'minus'}">${CATEGORY_ICONS[key]} ${value > 0 ? '+' : ''}${escapeHtml(value)}</span>`)
        .join('');
      return `
        <button type="button" class="btn choice ${disabled ? 'blocked' : ''}" data-option-id="${escapeHtml(option.id)}" ${disabled ? 'disabled' : ''}>
          <span class="choice-head">
            <strong>${escapeHtml(option.displayLabel)}) ${escapeHtml(stripOptionKeyPrefix(option.title))}</strong>
            <span class="choice-cost">Cost ${escapeHtml(cost)}</span>
          </span>
          <span class="small">${escapeHtml(option.description)}</span>
          <span class="impact-row">${deltas}</span>
        </button>
      `;
    }).join('');
  }

  function renderDecision(mission, state, runConfig, displayOptions = []) {
    const draft = state.rationaleDraftsByMissionId?.[mission.id] || {};
    const stakeholderOptions = (mission.stakeholders || []).map((stakeholder) => `
      <option value="${escapeHtml(stakeholder.id)}" ${draft.stakeholderId === stakeholder.id ? 'selected' : ''}>${escapeHtml(stakeholder.label)}</option>
    `).join('');
    const evidenceOptions = (mission.evidence || []).map((item) => `
      <option value="${escapeHtml(item.id)}" ${draft.evidenceId === item.id ? 'selected' : ''}>${escapeHtml(item.label)}</option>
    `).join('');
    const rubric = mission.rationaleRubric || {};

    return `
      ${renderTokenDashboard(state)}
      <section class="console-shell card decision-card">
        <h2>Decision and Rationale</h2>
        ${renderRunProgress(state, runConfig.RUN_LENGTH)}
        <p>Before choosing an intervention, commit to a stakeholder priority, cite one evidence point, and explain the trade-off you expect.</p>
        <section class="rationale-panel">
          <div class="grid two">
            <label class="form-field">
              <span>Priority stakeholder</span>
              <select data-rationale-field="stakeholderId">
                <option value="">Select one stakeholder</option>
                ${stakeholderOptions}
              </select>
            </label>
            <label class="form-field">
              <span>Evidence point to cite</span>
              <select data-rationale-field="evidenceId">
                <option value="">Select one evidence point</option>
                ${evidenceOptions}
              </select>
            </label>
          </div>
          <label class="form-field">
            <span>Expected trade-off</span>
            <textarea data-rationale-field="tradeoff" rows="4" placeholder="Explain what your option improves and what pressure it may create elsewhere.">${escapeHtml(draft.tradeoff || '')}</textarea>
          </label>
          <div class="summary-grid">
            <article class="summary-card">
              <h4>Rubric cue 1</h4>
              <p>${escapeHtml(rubric.stakeholderFocus || '')}</p>
            </article>
            <article class="summary-card">
              <h4>Rubric cue 2</h4>
              <p>${escapeHtml(rubric.evidenceUse || '')}</p>
            </article>
            <article class="summary-card">
              <h4>Rubric cue 3</h4>
              <p>${escapeHtml(rubric.tradeoffReasoning || '')}</p>
            </article>
          </div>
        </section>
        <div class="grid decision-grid" role="group" aria-label="Decision options">
          ${renderOptionCards(displayOptions, state)}
        </div>
      </section>
    `;
  }

  function renderFeedbackScreen(mission, state, runConfig) {
    return `
      ${renderTokenDashboard(state)}
      <section class="console-shell card mission-briefing">
        <p class="district-label">Decision Debrief</p>
        <h2>${escapeHtml(mission.name)}</h2>
        ${renderRunProgress(state, runConfig.RUN_LENGTH)}
        <p class="pedagogy-objective"><strong>What this case tested:</strong> ${escapeHtml(mission.learningObjectives.join(' '))}</p>
        <p>Review what changed, who was affected, and what to watch before you enter the next case.</p>
      </section>
      ${renderFeedback(state.currentFeedback, state)}
    `;
  }

  function renderFeedback(feedback, state) {
    const deltas = Object.entries(feedback.deltas || {}).map(([key, value]) => `
      <li>${escapeHtml(CATEGORY_LABELS[key])}: <strong>${value > 0 ? '+' : ''}${escapeHtml(value)}</strong></li>
    `).join('');
    const winners = (feedback.stakeholderImpacts?.winners || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const losers = (feedback.stakeholderImpacts?.losers || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const rationale = feedback.rationale || {};

    return `
      <section class="console-shell card feedback-card scene-transition scene-feedback" tabindex="-1">
        <h2>Outcome and Debrief</h2>
        <p class="feedback-summary"><strong>Immediate outcome:</strong> ${escapeHtml(feedback.text)}</p>
        <p class="feedback-flavor">${escapeHtml(feedback.systemInsight)}</p>
        <div class="summary-grid">
          <article class="summary-card">
            <h4>Destination effects</h4>
            <ul class="stakeholder-list">${deltas}</ul>
          </article>
          <article class="summary-card">
            <h4>Stakeholders who benefit most</h4>
            <ul class="stakeholder-list">${winners}</ul>
          </article>
          <article class="summary-card">
            <h4>Stakeholders under pressure</h4>
            <ul class="stakeholder-list">${losers}</ul>
          </article>
        </div>
        <details class="feedback-accordion" open>
          <summary>Your rationale snapshot</summary>
          <p><strong>Priority stakeholder:</strong> ${escapeHtml(rationale.stakeholderLabel || 'Not captured')}</p>
          <p><strong>Evidence cited:</strong> ${escapeHtml(rationale.evidenceLabel || 'Not captured')}</p>
          <p><strong>Expected trade-off:</strong> ${escapeHtml(rationale.tradeoff || 'Not captured')}</p>
          <p><strong>Reasoning score:</strong> ${escapeHtml(feedback.rationaleScore)}/3</p>
        </details>
        <details class="feedback-accordion">
          <summary>Pip coaching note</summary>
          <p>${escapeHtml(feedback.coachNote)}</p>
        </details>
        <details class="feedback-accordion">
          <summary>Learning theory tie-in</summary>
          <p>${escapeHtml(feedback.learningNote)}</p>
        </details>
        <details class="feedback-accordion">
          <summary>Reflect before the next case</summary>
          <p>${escapeHtml(feedback.reflectionPrompt)}</p>
        </details>
        ${state.topGateLockReason ? `<p class="small">Top Analyst currently blocked because: ${escapeHtml(state.topGateLockReason)}.</p>` : ''}
        <div class="inline-actions">
          <button type="button" id="btnReturnMap" class="btn">Return to Map</button>
        </div>
      </section>
    `;
  }

  function renderPipPanel(state, explanation, missionsById, currentMission) {
    const summaryBullets = (explanation?.summaryBullets || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const focusCards = (state.offerSetMissionIds || []).map((missionId) => {
      const mission = missionsById[missionId];
      const bullets = (explanation?.perMissionBullets?.[missionId] || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
      return `
        <article class="summary-card">
          <h4>${escapeHtml(mission?.name || missionId)}</h4>
          <ul class="stakeholder-list">${bullets}</ul>
        </article>
      `;
    }).join('');

    return `
      <section class="pip-header ${state.pipForceOpen ? 'state-warning' : 'state-guidance'}">
        <p class="small">Pip Learning Coach</p>
        <p><strong>${state.pipForceOpen ? 'Scaffold active:' : 'Coaching available:'}</strong> ${escapeHtml(currentMission?.tourismDomain || 'Tampa destination reasoning')}</p>
      </section>
      <h3>What to notice next</h3>
      <ul class="stakeholder-list">${summaryBullets}</ul>
      <div class="summary-grid">${focusCards}</div>
      <div class="inline-actions">
        <button type="button" id="btnPipClose" class="btn">Continue</button>
      </div>
    `;
  }

  function renderDecisionHistory(decisionHistory = []) {
    if (!decisionHistory.length) return '<p class="small">No completed cases yet.</p>';
    return `
      <section class="report-timeline">
        ${decisionHistory.map((entry, index) => `
          <article class="report-timeline-row">
            <p class="small report-timeline-step">Case ${index + 1}</p>
            <p><strong>${escapeHtml(entry.mission)}</strong></p>
            <p>Choice: ${escapeHtml(stripOptionKeyPrefix(entry.selectedOption))}</p>
            <p class="small"><strong>Stakeholder priority:</strong> ${escapeHtml(entry.rationale?.stakeholderLabel || 'Not logged')}</p>
            <p class="small"><strong>Evidence cited:</strong> ${escapeHtml(entry.rationale?.evidenceLabel || 'Not logged')}</p>
            <p class="small"><strong>Reasoning score:</strong> ${escapeHtml(entry.rationaleScore || 0)}/3</p>
            <p class="small report-timeline-impact">${escapeHtml(entry.feedbackOutcome || '')}</p>
          </article>
        `).join('')}
      </section>
    `;
  }

  function renderReflectionForm(state) {
    const responses = state.reflectionResponses || {};
    return `
      <section class="console-shell card">
        <h3>End-of-Run Reflection</h3>
        <div class="grid two reflection-grid">
          <label class="form-field">
            <span>What priority did you optimize for most often?</span>
            <textarea data-reflection-field="optimizedPriority" rows="3">${escapeHtml(responses.optimizedPriority || '')}</textarea>
          </label>
          <label class="form-field">
            <span>Which stakeholder benefited most from your overall strategy?</span>
            <textarea data-reflection-field="benefitedStakeholder" rows="3">${escapeHtml(responses.benefitedStakeholder || '')}</textarea>
          </label>
        </div>
        <label class="form-field">
          <span>What trade-off would you revisit in a second attempt?</span>
          <textarea data-reflection-field="revisitTradeoff" rows="4">${escapeHtml(responses.revisitTradeoff || '')}</textarea>
        </label>
        <div class="inline-actions">
          <button type="button" id="btnSubmitReflection" class="btn">${state.reflectionSubmitted ? 'Update Reflection' : 'Finalize Reflection'}</button>
        </div>
      </section>
    `;
  }

  function renderGameComplete(state) {
    const strongest = Object.entries(state.categories || {}).sort((left, right) => right[1] - left[1])[0];
    const weakest = Object.entries(state.categories || {}).sort((left, right) => left[1] - right[1])[0];

    return `
      ${renderTokenDashboard(state)}
      <section class="console-shell card report-card">
        <h2>Instructor Review Summary</h2>
        <p>You completed all four Tampa cases. This report combines destination performance with reasoning evidence and end-of-run reflection.</p>
        <div class="summary-grid">
          <article class="summary-card">
            <h3>Destination performance</h3>
            <p><strong>Balance Index:</strong> ${escapeHtml(state.BII)}</p>
            <p><strong>Rating band:</strong> ${escapeHtml(state.ratingBand)}</p>
            <p><strong>Strongest area:</strong> ${escapeHtml(CATEGORY_LABELS[strongest?.[0]] || 'N/A')}</p>
            <p><strong>Needs work:</strong> ${escapeHtml(CATEGORY_LABELS[weakest?.[0]] || 'N/A')}</p>
          </article>
          <article class="summary-card">
            <h3>Learning evidence</h3>
            <p><strong>Reasoning score:</strong> ${escapeHtml(state.learningScore)}/${escapeHtml(Math.max(state.decisionCount * 3, 1))}</p>
            <p><strong>Evidence points cited:</strong> ${escapeHtml(state.learningEvidenceUsedCount)}</p>
            <p><strong>Reflection status:</strong> ${state.reflectionSubmitted ? 'Submitted' : 'In progress'}</p>
          </article>
          <article class="summary-card">
            <h3>Rubric-aligned markers</h3>
            <p>Stakeholder balancing, evidence use, trade-off reasoning, and reflection completeness all appear in the timeline below.</p>
          </article>
        </div>
        ${renderReflectionForm(state)}
        <section class="console-shell card instructor-summary">
          <h3>Decision Timeline</h3>
          ${renderDecisionHistory(state.decisionHistory)}
        </section>
        <section class="console-shell card instructor-summary">
          <h3>Reflection Snapshot</h3>
          <p><strong>Priority optimized:</strong> ${escapeHtml(state.reflectionResponses?.optimizedPriority || 'Not provided yet')}</p>
          <p><strong>Stakeholder benefited most:</strong> ${escapeHtml(state.reflectionResponses?.benefitedStakeholder || 'Not provided yet')}</p>
          <p><strong>Trade-off to revisit:</strong> ${escapeHtml(state.reflectionResponses?.revisitTradeoff || 'Not provided yet')}</p>
        </section>
        <div class="inline-actions">
          <button type="button" id="btnBackMap" class="btn secondary">Review Map</button>
          <button type="button" id="btnPrintReport" class="btn">Print Summary</button>
        </div>
      </section>
    `;
  }

  function renderDashboard(state, runConfig) {
    return `
      <section class="dashboard-modal-shell">
        <p><strong>Case progress:</strong> ${escapeHtml(state.casesCompletedThisRun)}/${escapeHtml(runConfig.RUN_LENGTH)}</p>
        <p><strong>Destination Balance Index:</strong> ${escapeHtml(state.BII)}</p>
        <p><strong>Rating band:</strong> ${escapeHtml(state.ratingBand)}</p>
        <p><strong>Learning evidence score:</strong> ${escapeHtml(state.learningScore)}/${escapeHtml(Math.max(state.decisionCount * 3, 1))}</p>
        <p><strong>Evidence points cited:</strong> ${escapeHtml(state.learningEvidenceUsedCount)}</p>
        <p><strong>Poor outcome streak:</strong> ${escapeHtml(state.poorStreak)}</p>
      </section>
    `;
  }

  window.TE9000UI = {
    renderMap,
    renderExploration,
    renderDecision,
    renderFeedbackScreen,
    renderFeedback,
    renderPipPanel,
    renderGameComplete,
    renderDashboard,
    renderTokenDashboard,
    escapeHtml
  };
})();
