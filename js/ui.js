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

  const DISTRICT_MEDIA = {
    'downtown-waterfront': {
      src: 'assets/images/districts/downtown-waterfront.svg',
      srcset: 'assets/images/districts/downtown-waterfront.svg 1x',
      width: 1280,
      height: 720,
      alt: 'Riverwalk redevelopment zone with mixed-use pedestrian corridor and coordinated curb management.'
    },
    'cultural-corridor': {
      src: 'assets/images/districts/cultural-corridor.svg',
      srcset: 'assets/images/districts/cultural-corridor.svg 1x',
      width: 1280,
      height: 720,
      alt: 'Airport cultural corridor showing multilingual wayfinding, transit links, and visitor service touchpoints.'
    },
    'historic-ybor': {
      src: 'assets/images/districts/historic-ybor.svg',
      srcset: 'assets/images/districts/historic-ybor.svg 1x',
      width: 1280,
      height: 720,
      alt: 'Historic Ybor entertainment district balancing nightlife activity with heritage storefront preservation.'
    },
    'eco-park': {
      src: 'assets/images/districts/eco-park.svg',
      srcset: 'assets/images/districts/eco-park.svg 1x',
      width: 1280,
      height: 720,
      alt: 'Eco-park mobility loop with shaded paths, low-emission shuttles, and community recreation access.'
    },
    'beachfront-zone': {
      src: 'assets/images/districts/beachfront-zone.svg',
      srcset: 'assets/images/districts/beachfront-zone.svg 1x',
      width: 1280,
      height: 720,
      alt: 'Beachfront district transit transfer node linking cruise arrivals to waterfront retail and public access.'
    }
  };

  const MISSION_MEDIA = {
    'riverwalk-mobility-surge': {
      src: 'assets/images/missions/riverwalk-mobility-surge.svg',
      srcset: 'assets/images/missions/riverwalk-mobility-surge.svg 1x',
      width: 1280,
      height: 720,
      alt: 'Riverwalk intersection showing pedestrian crowding, curb conflicts, and temporary circulation controls.'
    },
    'ybor-nightlife-balance': {
      src: 'assets/images/missions/ybor-nightlife-balance.svg',
      srcset: 'assets/images/missions/ybor-nightlife-balance.svg 1x',
      width: 1280,
      height: 720,
      alt: 'Ybor nightlife corridor with heritage venues, noise mitigation zones, and permit-management checkpoints.'
    },
    'busch-queue-emissions': {
      src: 'assets/images/missions/busch-queue-emissions.svg',
      srcset: 'assets/images/missions/busch-queue-emissions.svg 1x',
      width: 1280,
      height: 720,
      alt: 'Theme-park queue network with shuttle electrification staging and wait-time pressure points.'
    },
    'port-cruise-dispersal': {
      src: 'assets/images/missions/port-cruise-dispersal.svg',
      srcset: 'assets/images/missions/port-cruise-dispersal.svg 1x',
      width: 1280,
      height: 720,
      alt: 'Cruise terminal exit plan illustrating staggered coach routing and neighborhood-sensitive dispersal paths.'
    }
  };

  const DEFAULT_IMAGE_DIMENSIONS = {
    width: 640,
    height: 360
  };

  function toResponsiveImageAttrs(media = {}, sizeHint) {
    const srcset = typeof media.srcset === 'string' ? media.srcset.trim() : '';
    const sizes = typeof sizeHint === 'string' && sizeHint.trim() ? sizeHint.trim() : '';
    return {
      srcset: srcset ? ` srcset="${escapeHtml(srcset)}"` : '',
      sizes: srcset && sizes ? ` sizes="${escapeHtml(sizes)}"` : ''
    };
  }

  function getMeaningfulAltText(rawAlt, fallbackAlt) {
    const candidate = typeof rawAlt === 'string' ? rawAlt.trim() : '';
    if (candidate) return candidate;
    const fallback = typeof fallbackAlt === 'string' ? fallbackAlt.trim() : '';
    return fallback || 'Illustrative tourism scenario image.';
  }

  function toImageDimensionAttrs(media = {}, fallback = DEFAULT_IMAGE_DIMENSIONS) {
    const candidateWidth = Number(media.width);
    const candidateHeight = Number(media.height);
    const width = Number.isFinite(candidateWidth) && candidateWidth > 0
      ? Math.round(candidateWidth)
      : fallback.width;
    const height = Number.isFinite(candidateHeight) && candidateHeight > 0
      ? Math.round(candidateHeight)
      : fallback.height;
    return ` width="${width}" height="${height}"`;
  }

  function nonCriticalImageAttrs() {
    return ' loading="lazy" decoding="async" fetchpriority="low"';
  }

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

  function formatImpactSummary(deltas) {
    if (!deltas || typeof deltas !== 'object') return 'No category deltas logged.';
    const primary = Object.entries(deltas)
      .filter(([, value]) => typeof value === 'number' && value !== 0)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 3)
      .map(([key, value]) => `${toCategoryLabel(key)} ${value > 0 ? '+' : ''}${value}`);
    return primary.length ? primary.join(' • ') : 'No category deltas logged.';
  }

  function renderDecisionHistory(decisionHistory) {
    if (!Array.isArray(decisionHistory) || !decisionHistory.length) {
      return '<p class="small">No decision history captured for this run.</p>';
    }

    const rows = decisionHistory.map((item, idx) => {
      const selectedOption = stripOptionKeyPrefix(item.selectedOption || item.optionTitle || 'Unknown option');
      const missionName = item.mission || item.missionName || 'Mission';
      const impactCost = item.cost ?? item.impactCost ?? 0;
      const feedbackText = item.shortOutcome || item.feedbackOutcome || item.feedbackText || item.feedbackNote || '';
      const feedback = feedbackText ? `<p class="small report-timeline-feedback"><strong>Outcome:</strong> ${escapeHtml(feedbackText)}</p>` : '';
      return `
        <article class="report-timeline-row">
          <p class="small report-timeline-step">Decision ${idx + 1}</p>
          <p><strong>${escapeHtml(missionName)}</strong></p>
          <p>Choice: ${escapeHtml(selectedOption)}</p>
          <p>Impact Cost: <strong>${escapeHtml(impactCost)}</strong></p>
          <p class="small report-timeline-impact">Impact summary: ${escapeHtml(formatImpactSummary(item.deltas))}</p>
          ${feedback}
        </article>
      `;
    }).join('');

    return `<section class="report-timeline" aria-label="Decision timeline in chronological order">${rows}</section>`;
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
    const latestOutcomeText = String(state.lastDecisionOutcomeText || '').trim();

    function renderDeltaChip(value) {
      if (typeof value !== 'number' || value === 0) return '';
      const deltaClass = value > 0 ? 'plus' : 'minus';
      const deltaLabel = value > 0 ? `+${value}` : `${value}`;
      const semanticClass = value > 0 ? 'good' : 'bad';
      return `<span class="token-delta-chip ${deltaClass} ${semanticClass}" aria-label="Recent token change ${escapeHtml(deltaLabel)}">${escapeHtml(deltaLabel)}</span>`;
    }

    const tokenItems = Object.entries(state.categories)
      .map(([key, value]) => `
        <div class="token-chip">
          <span class="token-icon" aria-hidden="true">${CATEGORY_ICONS[key]}</span>
          <div class="token-metric">
            <span class="token-label">${CATEGORY_LABELS[key]}</span>
            <div class="token-value-row">
              <strong>${value}</strong>
              ${decisionDeltas ? renderDeltaChip(decisionDeltas[key]) : ''}
            </div>
          </div>
        </div>
      `)
      .join('');

    const latestOutcomeStrip = latestOutcomeText
      ? `<p class="token-latest-outcome warn" aria-live="polite"><strong>Latest Outcome:</strong> ${escapeHtml(latestOutcomeText)}</p>`
      : '';

    return `
      <section class="console-shell token-dashboard" aria-label="Tourism Token Dashboard">
        <div class="token-row">${tokenItems}</div>
        <div class="composite-score">
          <span>Tourism Composite Score (BII)</span>
          <strong>${state.BII}</strong>
          <small>${escapeHtml(state.ratingBand)}</small>
        </div>
        ${latestOutcomeStrip}
      </section>
    `;
  }

  function renderMap(state, missions, constants, runConfig) {
    const highlightIds = new Set(state.highlightMissionIds || []);
    const districtCounts = {};
    const hiddenDistrictCounts = {};
    const MAX_VISIBLE_MARKERS_PER_DISTRICT = 2;
    const offeredMissions = missions.slice(0, 4);
    const selectedHotspotId = offeredMissions.some(mission => mission.id === state.selectedHotspotId)
      ? state.selectedHotspotId
      : (offeredMissions[0]?.id || null);
    const selectedMission = offeredMissions.find(mission => mission.id === selectedHotspotId) || null;

    const missionMarkers = offeredMissions.map(mission => {
      const role = state.offerSetRolesById?.[mission.id] || 'wildcard';
      const districtKey = getDistrictKey(mission);
      const districtLabel = escapeHtml(DISTRICT_LABELS[districtKey]);
      districtCounts[districtKey] = (districtCounts[districtKey] || 0) + 1;
      const stackIndex = districtCounts[districtKey] - 1;
      const shouldHideMarker = stackIndex >= MAX_VISIBLE_MARKERS_PER_DISTRICT;
      if (shouldHideMarker) {
        hiddenDistrictCounts[districtKey] = (hiddenDistrictCounts[districtKey] || 0) + 1;
      }
      const slotIndex = Math.min(stackIndex, MAX_VISIBLE_MARKERS_PER_DISTRICT - 1);
      const isSelected = selectedHotspotId === mission.id;

      return `
        <button
          class="map-hotspot-marker district-${districtKey} district-${districtKey}-slot-${slotIndex} ${highlightIds.has(mission.id) ? 'highlighted' : ''} ${isSelected ? 'is-selected' : ''} ${shouldHideMarker ? 'is-collapsed-chip' : ''}"
          style="--stack-index:${stackIndex};"
          data-hotspot-id="${escapeHtml(mission.id)}"
          data-district-key="${escapeHtml(districtKey)}"
          aria-pressed="${isSelected ? 'true' : 'false'}"
          aria-current="${isSelected ? 'location' : 'false'}"
          role="button"
          ${shouldHideMarker && !isSelected ? 'hidden' : ''}
          aria-label="View mission details: ${escapeHtml(mission.name)} in ${districtLabel}"
        >
          <span class="district-marker district-${districtKey}" aria-hidden="true"></span>
          <span class="marker-name">${escapeHtml(mission.name)}</span>
          <span class="marker-role tag ${ROLE_CLASS[role] || 'warn'}">${escapeHtml(roleLabel(role))}</span>
        </button>
      `;
    }).join('');

    const districtOverflowChips = Object.entries(hiddenDistrictCounts)
      .map(([districtKey, count]) => `
        <div class="map-overflow-chip district-${districtKey} district-${districtKey}-slot-1" aria-hidden="true">
          +${count} more
        </div>
      `)
      .join('');

    let missionDetailPanel = '<section class="map-mission-detail card" aria-live="polite"><p class="small">No missions currently available.</p></section>';
    if (selectedMission) {
      const districtKey = getDistrictKey(selectedMission);
      const districtLabel = escapeHtml(DISTRICT_LABELS[districtKey]);
      const role = state.offerSetRolesById?.[selectedMission.id] || 'wildcard';
      const missionMedia = MISSION_MEDIA[selectedMission.id] || DISTRICT_MEDIA[districtKey] || null;
      const thumbnailAttrs = toResponsiveImageAttrs(missionMedia, '(max-width: 960px) 100vw, 360px');
      const thumbnailDimensions = toImageDimensionAttrs(missionMedia);
      const thumbnail = missionMedia
        ? `
          <div class="hotspot-thumbnail">
            <img
              src="${escapeHtml(missionMedia.src)}"
              ${thumbnailAttrs.srcset}
              ${thumbnailAttrs.sizes}
              alt=""
              ${nonCriticalImageAttrs()}
              ${thumbnailDimensions}
              onerror="this.closest('.hotspot-thumbnail')?.remove()"
            >
          </div>
        `
        : '';

      const objectiveLine = String(selectedMission.description || '').split(/(?<=[.!?])\s+/)[0] || selectedMission.description || 'Review this mission to balance tourism outcomes.';

      missionDetailPanel = `
        <section class="console-shell map-mission-detail ${selectedMission ? 'is-selected' : ''}" aria-live="polite" aria-label="Selected mission detail">
          ${thumbnail}
          <p class="district-label">${districtLabel}</p>
          <h3>${escapeHtml(selectedMission.name)}</h3>
          <p class="mission-objective">${escapeHtml(objectiveLine)}</p>
          <button class="btn" data-mission-id="${escapeHtml(selectedMission.id)}" aria-label="Enter mission: ${escapeHtml(selectedMission.name)}">Enter Mission</button>
          <p class="small mission-microcopy">Need details first? Expand a section below.</p>
          <details class="mission-detail-drawer">
            <summary>Mission Context</summary>
            <div class="mission-detail-content">
              <p class="small"><strong>Role:</strong> ${escapeHtml(roleLabel(role))}</p>
              <p class="small"><strong>Hub:</strong> ${escapeHtml(selectedMission.hub || selectedMission.area || 'City Hub')}</p>
              <p class="small">${escapeHtml(selectedMission.description)}</p>
            </div>
          </details>
          <details class="mission-detail-drawer">
            <summary>How scoring works</summary>
            <div class="mission-detail-content">
              <p class="small">Each mission starts with <strong>${constants.impactBudgetPerHotspot} Impact Points</strong>.</p>
              <p class="small">Choices change category tokens, and your composite score rewards balance over one-dimensional gains.</p>
            </div>
          </details>
        </section>
      `;
    }

    const pipIndicator = state.pipVoluntaryIndicator
      ? '<p class="tag warn">Need a nudge? Pip has a quick district-balance coaching tip.</p>'
      : '';

    const antiCheeseNudge = state.showPatternGamingNudge
      ? '<p class="tag warn">Micro-tip: options shuffle each case—read the impact, not the letter.</p>'
      : '';

    const districtLegendItems = DISTRICT_STORYBOARD_ORDER
      .map(districtKey => `
        <li class="district-legend-item">
          <span class="district-marker district-${districtKey}" aria-hidden="true"></span>
          <span>${escapeHtml(DISTRICT_LABELS[districtKey])}</span>
        </li>
      `)
      .join('');

    const onboardingOverlay = state.mapOnboardingDismissed
      ? ''
      : `
        <div class="map-onboarding-overlay" role="dialog" aria-modal="false" aria-label="Quick map walkthrough">
          <section class="console-shell map-onboarding-panel">
            <h3>Quick Start</h3>
            <ol>
              <li>Pick a mission marker in the map.</li>
              <li>Review the selected mission panel.</li>
              <li>Press <strong>Enter Mission</strong> to continue.</li>
            </ol>
            <button class="btn" data-dismiss-map-onboarding="true">Got it</button>
          </section>
        </div>
      `;

    return `
      ${renderTokenDashboard(state)}
      <section class="map-stage">
        <div class="map-overview-stack map-zone-status" aria-label="Run status">
          <section class="console-shell card map-intro-card" tabindex="0">
            <h2>Run Status</h2>
            ${renderRunProgress(state, runConfig.RUN_LENGTH)}
            <p class="small"><strong>Missions Complete:</strong> ${state.casesCompletedThisRun}/${runConfig.RUN_LENGTH}</p>
            <p class="small">Choose one map marker to load your next mission.</p>
            ${pipIndicator}
            ${antiCheeseNudge}
            <div class="inline-actions">
              <button id="btnAskPipWhy" class="btn secondary">Ask Pip why these cases?</button>
            </div>
          </section>
          <details class="console-shell card budget-card aux-panel-collapsible">
            <summary>Impact Budget</summary>
            <p><strong>${constants.impactBudgetPerHotspot} points</strong> per mission. Over-budget choices are blocked.</p>
          </details>
          <details class="console-shell map-board-chrome aux-panel-collapsible" aria-label="Map legend and orientation cues">
            <summary>District Legend</summary>
            <p class="map-board-cue" aria-hidden="true">🧭 North ↑ · Waterfront edge ≈ bay side</p>
            <ul>
              ${districtLegendItems}
            </ul>
          </details>
        </div>
        <div class="map-board-stack map-zone-play" aria-label="Play area">
          <p class="map-selection-helper">Tap a marker, then use Enter Mission.</p>
          <section class="console-shell city-map-board" aria-label="Tampa map hotspots" role="group">
            ${missionMarkers}
            ${districtOverflowChips}
          </section>
          ${onboardingOverlay}
        </div>
        <div class="map-zone-selected" aria-label="Selected mission">
          ${missionDetailPanel}
        </div>
      </section>
    `;
  }

  function renderExploration(mission, state, runConfig) {
    const points = (mission.exploration.bullets || mission.exploration.dataPoints || [])
      .map(point => `<li>${escapeHtml(point)}</li>`)
      .join('');
    const fallbackLabel = escapeHtml(mission.exploration.mediaLabel || 'Mission visual / source evidence panel');
    const legacyEvidence = mission.exploration?.visualEvidence || {};
    const evidenceImage = typeof mission.exploration?.image === 'string'
      ? mission.exploration.image.trim()
      : (typeof legacyEvidence.imagePath === 'string' ? legacyEvidence.imagePath.trim() : '');
    const evidenceCaption = mission.exploration?.caption || legacyEvidence.caption || '';
    const evidenceSource = mission.exploration?.source || legacyEvidence.sourceLabel || '';
    const evidenceAlt = getMeaningfulAltText(mission.exploration?.alt || legacyEvidence.alt, evidenceCaption || mission.name);
    const evidenceType = escapeHtml(legacyEvidence?.type || 'image');
    const evidenceMediaMeta = {
      src: evidenceImage,
      srcset: mission.exploration?.srcset || legacyEvidence?.srcset || ''
    };
    const evidenceAttrs = toResponsiveImageAttrs(evidenceMediaMeta, '(max-width: 960px) 100vw, 360px');
    const evidenceDimensions = toImageDimensionAttrs(mission.exploration || legacyEvidence || {});
    const evidenceCard = evidenceImage
      ? `
        <article class="evidence-card" aria-label="Mission evidence ${evidenceType}">
          <div class="evidence-media-wrap">
            <img
              class="evidence-media"
              src="${escapeHtml(evidenceImage)}"
              ${evidenceAttrs.srcset}
              ${evidenceAttrs.sizes}
              alt="${escapeHtml(evidenceAlt)}"
              ${nonCriticalImageAttrs()}
              ${evidenceDimensions}
              onerror="this.closest('.evidence-card').outerHTML='&lt;div class=&quot;media-placeholder evidence-placeholder&quot; aria-label=&quot;Placeholder media panel&quot;&gt;${fallbackLabel}&lt;/div&gt;'"
            >
            <span class="evidence-type-badge">${evidenceType}</span>
          </div>
          ${evidenceCaption ? `<p class="small evidence-caption">${escapeHtml(evidenceCaption)}</p>` : ''}
          ${evidenceSource ? `<p class="small evidence-source">${escapeHtml(evidenceSource)}</p>` : ''}
        </article>
      `
      : `<div class="media-placeholder evidence-placeholder" aria-label="Placeholder media panel">${fallbackLabel}</div>`;
    const missionImage = typeof mission.exploration?.image === 'string' ? mission.exploration.image.trim() : '';
    const missionMedia = {
      src: missionImage,
      srcset: mission.exploration?.srcset || ''
    };
    const missionMediaAttrs = toResponsiveImageAttrs(missionMedia, '(max-width: 960px) 100vw, 480px');
    const missionMediaDimensions = toImageDimensionAttrs(mission.exploration || {});
    const missionAlt = getMeaningfulAltText(mission.exploration?.alt, `${mission.name} mission visual`);
    const missionCaption = mission.exploration?.caption || mission.exploration?.mediaLabel || 'Mission visual evidence';
    const missionSource = mission.exploration?.source;
    const mediaPanel = missionImage
      ? `
        <figure class="mission-media" aria-label="Mission visual evidence">
          <img
            src="${escapeHtml(missionImage)}"
            ${missionMediaAttrs.srcset}
            ${missionMediaAttrs.sizes}
            alt="${escapeHtml(missionAlt)}"
            loading="lazy"
            decoding="async"
            ${missionMediaDimensions}
            onerror="this.closest('figure').outerHTML='&lt;div class=&quot;media-placeholder&quot; aria-label=&quot;Placeholder media panel&quot;&gt;${fallbackLabel}&lt;/div&gt;'"
          >
          <figcaption>
            <span class="mission-media-caption">${escapeHtml(missionCaption)}</span>
            ${missionSource ? `<span class="mission-media-source">${escapeHtml(missionSource)}</span>` : ''}
          </figcaption>
        </figure>
      `
      : `<div class="media-placeholder" aria-label="Placeholder media panel">${fallbackLabel}</div>`;

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
            ${evidenceCard}
          </div>
          ${mediaPanel}
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

  function computeProjectedCategories(categories, deltas = {}) {
    const projected = {};
    const categoryKeys = new Set([
      ...Object.keys(categories || {}),
      ...Object.keys(deltas || {})
    ]);

    categoryKeys.forEach((key) => {
      const currentValue = Number(categories?.[key]) || 0;
      const deltaValue = Number(deltas?.[key]) || 0;
      projected[key] = currentValue + deltaValue;
    });

    return projected;
  }

  function computeProjectedBalanceRisk(projectedCategories) {
    const values = Object.values(projectedCategories || {});
    if (!values.length) {
      return { label: 'Moderate', minCategory: 0, variance: 0 };
    }

    const projectedMinCategory = Math.min(...values);
    const projectedVariance = Math.max(...values) - projectedMinCategory;
    const scoringConstants = window.TE9000Scoring?.SCORING_CONSTANTS;
    const minTarget = scoringConstants?.vMinCategoryTop ?? 2;
    const varianceTarget = scoringConstants?.vMaxVarianceTop ?? 2;

    let label = 'Low';

    if (projectedMinCategory < 0 || projectedVariance > varianceTarget + 2 || projectedMinCategory < minTarget - 1) {
      label = 'High';
    } else if (projectedMinCategory < minTarget || projectedVariance > varianceTarget) {
      label = 'Moderate';
    }

    return {
      label,
      minCategory: projectedMinCategory,
      variance: projectedVariance
    };
  }

  function renderDecision(mission, state, runConfig, displayOptions = []) {
    const optionButtons = displayOptions
      .map(opt => {
        const optionCost = opt.cost ?? opt.impactCost;
        const afford = state.impactPointsRemaining >= optionCost;
        const displayTitle = stripOptionKeyPrefix(opt.title);
        const projectedCategories = computeProjectedCategories(state.categories, opt.deltas);
        const projectedRisk = computeProjectedBalanceRisk(projectedCategories);
        const snapshotSummary = Object.entries(projectedCategories)
          .map(([key, value]) => `${CATEGORY_ICONS[key]} ${value}`)
          .join(' • ');
        const riskClass = projectedRisk.label.toLowerCase();
        const riskText = `Risk: ${projectedRisk.label} (minCategory ${projectedRisk.minCategory}, variance ${projectedRisk.variance})`;

        return `
          <button class="btn choice ${afford ? '' : 'blocked'}" data-option-id="${escapeHtml(opt.displayLabel)}" aria-label="${escapeHtml(afford ? `Select option ${opt.displayLabel}: ${displayTitle}` : `Option ${opt.displayLabel}: ${displayTitle} unavailable due to insufficient budget`)}" ${afford ? '' : 'disabled'}>
            <span class="choice-head">
              <strong>${escapeHtml(opt.displayLabel)}) ${escapeHtml(displayTitle)}</strong>
              <span class="choice-cost">Cost ${optionCost}</span>
            </span>
            <span class="small">${escapeHtml(opt.description)}</span>
            <span class="impact-row">${renderImpactPills(opt.deltas || {})}</span>
            <span class="projected-risk risk-${riskClass}" title="Projected totals by category: ${escapeHtml(snapshotSummary)}">${escapeHtml(riskText)}</span>
            <span class="small">${afford ? `${state.impactPointsRemaining} points remaining before decision` : 'Insufficient budget'}</span>
          </button>
        `;
      })
      .join('');

    return `
      ${renderTokenDashboard(state)}
      <section class="console-shell card decision-card">
        <h2>Decision Point</h2>
        ${renderRunProgress(state, runConfig.RUN_LENGTH)}
        <p>Choose one strategy. Each option improves some categories while creating trade-offs.</p>
        <p><strong>Impact Points Remaining:</strong> ${state.impactPointsRemaining}</p>
        <div class="grid decision-grid" role="group" aria-label="Decision options">${optionButtons}</div>
      </section>
      <section id="feedbackContainer"></section>
    `;
  }

  function deltaText(delta) {
    if (delta > 0) return `+${delta}`;
    return `${delta}`;
  }

  function renderFeedback(feedback, state) {
    const categoryDeltaChips = Object.entries(feedback.deltas)
      .filter(([, value]) => typeof value === 'number' && value !== 0)
      .map(([key, value]) => {
        const directionIcon = value > 0 ? '▲' : '▼';
        const directionClass = value > 0 ? 'up' : 'down';
        const magnitude = value > 0 ? `+${value}` : String(value);
        return `<li class="feedback-delta-chip ${directionClass}"><span aria-hidden="true">${directionIcon}</span> <strong>${CATEGORY_ICONS[key]}</strong> ${escapeHtml(magnitude)}</li>`;
      })
      .join('');

    const deltaItems = Object.entries(feedback.deltas)
      .map(([key, value]) => `<li>${CATEGORY_LABELS[key]}: <strong>${deltaText(value)}</strong></li>`)
      .join('');

    return `
      <section class="console-shell card feedback-card" tabindex="-1">
        <h2>Outcome Feedback</h2>
        <p class="feedback-summary"><strong>Outcome in 1 sentence:</strong> ${escapeHtml(feedback.text)}</p>
        <ul class="feedback-delta-header" aria-label="Category movement summary">${categoryDeltaChips || '<li class="feedback-delta-chip neutral">No category changes</li>'}</ul>
        <details class="feedback-accordion" open>
          <summary>Why this happened</summary>
          <p>${escapeHtml(feedback.systemInsight)}</p>
        </details>
        <details class="feedback-accordion">
          <summary>Trade-off</summary>
          <p>${escapeHtml(feedback.tradeoffSpotlight)}</p>
        </details>
        <details class="feedback-accordion">
          <summary>What to try next</summary>
          <p>${escapeHtml(feedback.whatToTryNext)}</p>
        </details>
        <details class="feedback-accordion feedback-learn-more">
          <summary>Learn more</summary>
          <p>${escapeHtml(feedback.learningNote)}</p>
        </details>
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
        <h3>Decision Timeline</h3>
        ${renderDecisionHistory(state.decisionHistory)}
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
