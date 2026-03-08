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

  const PEDAGOGY_TAG_LABELS = {
    remediation: 'Recovery planning',
    'variance-control': 'Systems balancing',
    mobility: 'Mobility planning',
    variety: 'Portfolio variety',
    culture: 'Cultural stewardship',
    'consequence-followup': 'Consequence tracking',
    equity: 'Equity lens',
    'high-impact': 'High-impact choices',
    hospitality: 'Service design',
    pricing: 'Pricing strategy',
    safety: 'Safety readiness',
    'same-hub': 'Hub continuity',
    satisfaction: 'Visitor satisfaction',
    'visitor-satisfaction': 'Visitor satisfaction',
    sustainability: 'Sustainability practice'
  };

  const REINFORCE_LABELS = {
    economic: 'Economic Capital',
    sustainability: 'Sustainability',
    culture: 'Cultural Inclusion',
    hospitality: 'Hospitality',
    satisfaction: 'Visitor Satisfaction'
  };

  const MASTERY_DIMENSIONS = {
    equity: ['equity', 'culture', 'variety', 'hospitality', 'satisfaction', 'visitor-satisfaction'],
    resilience: ['sustainability', 'safety', 'remediation', 'mobility', 'consequence-followup'],
    'systems-balancing': ['variance-control', 'high-impact', 'pricing', 'same-hub', 'remediation']
  };

  function getFallbackDistrictArt(districtKey) {
    return DISTRICT_MEDIA[districtKey] || null;
  }

  function getMissionMediaBundle(mission) {
    const districtKey = getDistrictKey(mission);
    const fallbackDistrictArt = getFallbackDistrictArt(districtKey);
    const missionMedia = mission?.media || {};

    function normalizeImageMeta(primary, secondary, defaults = {}) {
      const primaryImagePath = typeof primary?.imagePath === 'string' ? primary.imagePath.trim() : '';
      const secondaryImagePath = typeof secondary?.imagePath === 'string' ? secondary.imagePath.trim() : '';
      const imagePath = primaryImagePath || secondaryImagePath || defaults.imagePath || '';
      return {
        imagePath,
        srcset: (typeof primary?.srcset === 'string' && primary.srcset.trim())
          || (typeof secondary?.srcset === 'string' && secondary.srcset.trim())
          || (imagePath ? `${imagePath} 1x` : ''),
        alt: (typeof primary?.alt === 'string' && primary.alt.trim())
          || (typeof secondary?.alt === 'string' && secondary.alt.trim())
          || defaults.alt
          || '',
        caption: (typeof primary?.caption === 'string' && primary.caption.trim())
          || (typeof secondary?.caption === 'string' && secondary.caption.trim())
          || defaults.caption
          || '',
        sourceLabel: (typeof primary?.sourceLabel === 'string' && primary.sourceLabel.trim())
          || (typeof secondary?.sourceLabel === 'string' && secondary.sourceLabel.trim())
          || defaults.sourceLabel
          || '',
        type: (typeof primary?.type === 'string' && primary.type.trim()) || defaults.type || 'image'
      };
    }

    const legacyExploration = mission?.exploration || {};
    const legacyEvidence = legacyExploration.visualEvidence || {};
    const legacyImage = typeof legacyExploration.image === 'string' ? legacyExploration.image.trim() : '';
    const missionMediaMapEntry = MISSION_MEDIA[mission?.id] || null;

    const hero = normalizeImageMeta(missionMedia.hero, {
      imagePath: legacyImage || missionMediaMapEntry?.src || fallbackDistrictArt?.src || '',
      srcset: legacyExploration.srcset || missionMediaMapEntry?.srcset || fallbackDistrictArt?.srcset || '',
      alt: legacyExploration.alt || missionMediaMapEntry?.alt || fallbackDistrictArt?.alt || '',
      caption: legacyExploration.caption || legacyExploration.mediaLabel || `${mission?.name || 'Mission'} visual`,
      sourceLabel: legacyExploration.source || 'Source: District field briefing'
    });

    const thumbnail = normalizeImageMeta(missionMedia.thumbnail, missionMedia.hero, {
      imagePath: hero.imagePath,
      srcset: hero.srcset,
      alt: hero.alt,
      caption: hero.caption,
      sourceLabel: hero.sourceLabel
    });

    const evidence = normalizeImageMeta(missionMedia.evidenceChart, legacyEvidence, {
      imagePath: legacyEvidence.imagePath || '',
      srcset: legacyEvidence.srcset || '',
      alt: legacyEvidence.alt || hero.alt,
      caption: legacyEvidence.caption || hero.caption,
      sourceLabel: legacyEvidence.sourceLabel || hero.sourceLabel,
      type: legacyEvidence.type || 'chart'
    });

    return {
      districtKey,
      fallbackDistrictArt,
      hero,
      thumbnail,
      evidence
    };
  }

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

  function toTitleCase(value) {
    return String(value || '')
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' ');
  }

  function normalizePedagogyTags(pedagogy) {
    return Array.from(new Set((pedagogy?.tags || []).map(tag => String(tag || '').trim()).filter(Boolean)));
  }

  function pedagogyTagLabel(tag) {
    return PEDAGOGY_TAG_LABELS[tag] || toTitleCase(tag);
  }

  function reinforceLabel(reinforce) {
    return REINFORCE_LABELS[reinforce] || toTitleCase(reinforce);
  }

  function buildLearningObjective(mission) {
    const reinforces = (mission?.pedagogy?.reinforces || []).map(reinforceLabel).slice(0, 2);
    const focus = reinforceLabel(mission?.issueType || 'systems balancing');
    if (reinforces.length === 2) {
      return `Strengthen ${reinforces[0]} and ${reinforces[1]} while managing ${focus}.`;
    }
    if (reinforces.length === 1) {
      return `Strengthen ${reinforces[0]} while managing ${focus}.`;
    }
    return `Practice balanced decisions while managing ${focus}.`;
  }

  function renderSkillTagList(tags, variant = 'good') {
    if (!tags.length) return '<span class="tag warn">General systems practice</span>';
    return tags.map(tag => `<span class="tag ${variant}">${escapeHtml(pedagogyTagLabel(tag))}</span>`).join('');
  }

  function computeMasteryTracker(decisionHistory = []) {
    const tracker = {
      equity: 0,
      resilience: 0,
      'systems-balancing': 0
    };

    decisionHistory.forEach((decision) => {
      const tags = new Set((decision?.pedagogyTags || []).map(tag => String(tag || '').trim()).filter(Boolean));
      Object.entries(MASTERY_DIMENSIONS).forEach(([dimension, mappedTags]) => {
        if (mappedTags.some(tag => tags.has(tag))) tracker[dimension] += 1;
      });
    });

    return tracker;
  }

  function masteryTierLabel(score) {
    if (score >= 4) return 'Strong';
    if (score >= 2) return 'Building';
    if (score >= 1) return 'Emerging';
    return 'Not started';
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

  function renderTurnHeader(state, runLength) {
    const caseNumber = Math.min(state.casesCompletedThisRun + 1, runLength);
    const trend = state.riskTrend || 'steady';
    const trendArrow = trend === 'up' ? '↗' : (trend === 'down' ? '↘' : '→');
    const trendLabel = trend === 'up' ? 'Risk rising' : (trend === 'down' ? 'Risk easing' : 'Risk steady');
    const goal = state.turnGoal || 'Pick a mission that improves your weakest category without overloading another.';

    return `
      <section class="console-shell card turn-header" aria-label="Turn status">
        <p class="small"><strong>Case ${caseNumber}/${runLength}</strong></p>
        <p class="small" aria-label="Risk trend">${trendArrow} ${escapeHtml(trendLabel)}</p>
        <p class="small"><strong>Goal:</strong> ${escapeHtml(goal)}</p>
      </section>
    `;
  }

  function getDistrictKey(mission) {
    return DISTRICT_BY_HUB[mission.hub] || 'historic-ybor';
  }

  function computeMilestoneBadges(state) {
    const history = Array.isArray(state.decisionHistory) ? state.decisionHistory : [];
    if (!history.length) return [];

    const scoringConstants = window.TE9000Scoring?.SCORING_CONSTANTS;
    const varianceTarget = scoringConstants?.vMaxVarianceTop ?? 2;
    const lastThree = history.slice(-3);
    const allBalancedInWindow = lastThree.length >= 3 && lastThree.every((entry) => {
      const deltas = Object.values(entry?.deltas || {});
      const positives = deltas.filter(value => value > 0).length;
      const negatives = deltas.filter(value => value < 0).length;
      const net = deltas.reduce((sum, value) => sum + value, 0);
      return positives >= 2 && negatives <= 2 && net >= 0;
    });

    const hadEarlierDeficit = history.slice(0, -1).some((entry) => {
      const values = Object.values(entry?.deltas || {});
      return values.some(value => value < 0);
    });

    const latestDeltas = state.lastDecisionDeltas || {};
    const strongestLift = Object.entries(latestDeltas)
      .filter(([, value]) => typeof value === 'number' && value > 0)
      .sort((left, right) => right[1] - left[1])[0]?.[0];
    const recentNet = Object.values(latestDeltas).reduce((sum, value) => sum + (Number(value) || 0), 0);
    const previousNet = Object.values(history[history.length - 2]?.deltas || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);

    const badges = [];
    if (allBalancedInWindow && state.variance <= varianceTarget + 1) {
      badges.push({ label: 'Balanced Run', tone: 'good', detail: '3 stable decisions in a row.' });
    }
    if (hadEarlierDeficit && state.minCategory >= 0 && (latestDeltas.culture > 0 || latestDeltas.satisfaction > 0)) {
      badges.push({ label: 'Equity Recovery', tone: 'warn', detail: `${toCategoryLabel(strongestLift || 'culture')} rebounded.` });
    }
    if (history.length >= 2 && previousNet < 0 && recentNet > 0 && (latestDeltas.sustainability > 0 || latestDeltas.hospitality > 0)) {
      badges.push({ label: 'Resilience Save', tone: 'good', detail: 'Recovered immediately after a setback.' });
    }
    return badges.slice(0, 3);
  }

  function buildFlavorLine(feedback, state) {
    const pools = {
      recovery: [
        'Field teams adjusted quickly, and pressure dropped across the district.',
        'That response stabilized operations faster than expected.',
        'You absorbed the shock and restored control in one move.'
      ],
      momentum: [
        'Momentum is building—keep reinforcing weak categories while gains hold.',
        'Visitors are feeling the improvement; now protect system balance.',
        'A clean operational win. Keep the next move measured.'
      ],
      caution: [
        'Short-term relief came with longer-term pressure to monitor.',
        'The mission landed, but uneven effects are now visible.',
        'Useful gains, though one side of the system is stretching thin.'
      ],
      setback: [
        'The city can recover, but the next mission should be corrective.',
        'This outcome exposed fragility—target your lowest category next.',
        'Signals are mixed; prioritize stabilization before expansion.'
      ]
    };

    const recentNet = Object.values(feedback?.deltas || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
    const previousNet = Object.values((state.decisionHistory || []).slice(-2)[0]?.deltas || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
    let key = 'caution';
    if (feedback?.poorOutcome) key = 'setback';
    else if (previousNet < 0 && recentNet > 0) key = 'recovery';
    else if (recentNet >= 2) key = 'momentum';

    const bucket = pools[key];
    const index = Math.abs((state.decisionCount || 0) + Math.round(state.BII || 0)) % bucket.length;
    return bucket[index];
  }


  function renderTokenDashboard(state) {
    const decisionDeltas = state.lastDecisionDeltas || null;
    const latestOutcomeText = String(state.lastDecisionOutcomeText || '').trim();

    function renderDeltaChip(value) {
      if (typeof value !== 'number' || value === 0) return '';
      const deltaClass = value > 0 ? 'plus' : 'minus';
      const deltaLabel = value > 0 ? `+${value}` : `${value}`;
      const semanticClass = value > 0 ? 'good' : 'bad';
      return `<span class="token-delta-chip token-delta-pulse ${deltaClass} ${semanticClass}" aria-label="Recent token change ${escapeHtml(deltaLabel)}">${escapeHtml(deltaLabel)}</span>`;
    }

    const milestoneBadges = computeMilestoneBadges(state);
    const milestoneStrip = milestoneBadges.length
      ? `<div class="milestone-badge-row" aria-label="Run milestones">${milestoneBadges.map((badge) => `<span class="tag ${badge.tone} milestone-badge" title="${escapeHtml(badge.detail)}">${escapeHtml(badge.label)}</span>`).join('')}</div>`
      : '';

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
          ${milestoneStrip}
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
    const suggestedMissionId = offeredMissions.some(mission => mission.id === state.suggestedMissionId)
      ? state.suggestedMissionId
      : (offeredMissions[0]?.id || null);

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
      const isSuggested = suggestedMissionId === mission.id;

      return `
        <button
          class="map-hotspot-marker district-${districtKey} district-${districtKey}-slot-${slotIndex} ${highlightIds.has(mission.id) ? 'highlighted' : ''} ${isSelected ? 'is-selected' : ''} ${isSuggested ? 'is-suggested' : ''} ${shouldHideMarker ? 'is-collapsed-chip' : ''}"
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
          ${isSuggested ? '<span class="tag good">Suggested Next Move</span>' : ''}
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
      const isSuggested = selectedMission.id === suggestedMissionId;
      const missionVisuals = getMissionMediaBundle(selectedMission);
      const heroStripMeta = {
        src: missionVisuals.hero.imagePath || missionVisuals.fallbackDistrictArt?.src || '',
        srcset: missionVisuals.hero.srcset || missionVisuals.fallbackDistrictArt?.srcset || '',
        width: 1280,
        height: 360
      };
      const heroStripAttrs = toResponsiveImageAttrs(heroStripMeta, '(max-width: 960px) 100vw, 360px');
      const heroStripDimensions = toImageDimensionAttrs(heroStripMeta, { width: 1280, height: 360 });
      const heroStripFallbackSrc = missionVisuals.fallbackDistrictArt?.src || '';
      const heroStrip = heroStripMeta.src
        ? `
          <div class="hotspot-hero-strip" aria-hidden="true">
            <img
              src="${escapeHtml(heroStripMeta.src)}"
              ${heroStripAttrs.srcset}
              ${heroStripAttrs.sizes}
              alt=""
              ${nonCriticalImageAttrs()}
              ${heroStripDimensions}
              onerror="if(!this.dataset.fallbackApplied && '${escapeHtml(heroStripFallbackSrc)}'){this.dataset.fallbackApplied='1';this.src='${escapeHtml(heroStripFallbackSrc)}';this.srcset='${escapeHtml(missionVisuals.fallbackDistrictArt?.srcset || '')}';}else{this.closest('.hotspot-hero-strip')?.remove();}"
            >
          </div>
        `
        : '';

      const objectiveLine = String(selectedMission.description || '').split(/(?<=[.!?])\s+/)[0] || selectedMission.description || 'Review this mission to balance tourism outcomes.';

      missionDetailPanel = `
        <section class="console-shell map-mission-detail ${selectedMission ? 'is-selected' : ''}" aria-live="polite" aria-label="Selected mission detail">
          ${heroStrip}
          <p class="district-label">${districtLabel}</p>
          <h3>${escapeHtml(selectedMission.name)}</h3>
          ${isSuggested ? '<p class="tag good">Suggested Next Move</p>' : ''}
          <p class="mission-objective">${escapeHtml(objectiveLine)}</p>
          <button class="btn" data-mission-id="${escapeHtml(selectedMission.id)}" data-primary-cta="enter-mission" aria-label="Enter mission: ${escapeHtml(selectedMission.name)}">Enter Mission</button>
          <button class="btn secondary" type="button" data-surprise-mission="true" aria-label="Surprise me with a mission">Surprise me</button>
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
      <div class="scene-transition scene-map">
      ${renderTokenDashboard(state)}
      <section class="map-stage">
        <div class="map-overview-stack map-zone-status" aria-label="Run status">
          ${renderTurnHeader(state, runConfig.RUN_LENGTH)}
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
      </div>
    `;
  }

  function renderExploration(mission, state, runConfig) {
    const missionVisuals = getMissionMediaBundle(mission);
    const points = (mission.exploration.bullets || mission.exploration.dataPoints || [])
      .map(point => `<li>${escapeHtml(point)}</li>`)
      .join('');
    const fallbackLabel = escapeHtml(mission.exploration.mediaLabel || 'Mission visual / source evidence panel');
    const evidenceImage = missionVisuals.evidence.imagePath || missionVisuals.hero.imagePath;
    const evidenceCaption = missionVisuals.evidence.caption || missionVisuals.hero.caption;
    const evidenceSource = missionVisuals.evidence.sourceLabel || missionVisuals.hero.sourceLabel;
    const evidenceAlt = getMeaningfulAltText(missionVisuals.evidence.alt || missionVisuals.hero.alt, evidenceCaption || mission.name);
    const evidenceType = escapeHtml(missionVisuals.evidence.type || 'image');
    const evidenceMediaMeta = {
      src: evidenceImage,
      srcset: missionVisuals.evidence.srcset || missionVisuals.hero.srcset || ''
    };
    const evidenceAttrs = toResponsiveImageAttrs(evidenceMediaMeta, '(max-width: 960px) 100vw, 360px');
    const evidenceDimensions = toImageDimensionAttrs({ width: 1280, height: 720 });
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
              onerror="if(!this.dataset.fallbackApplied && '${escapeHtml(missionVisuals.fallbackDistrictArt?.src || '')}'){this.dataset.fallbackApplied='1';this.src='${escapeHtml(missionVisuals.fallbackDistrictArt?.src || '')}';this.srcset='${escapeHtml(missionVisuals.fallbackDistrictArt?.srcset || '')}';}else{this.closest('.evidence-card').outerHTML='&lt;div class=&quot;media-placeholder evidence-placeholder&quot; aria-label=&quot;Placeholder media panel&quot;&gt;${fallbackLabel}&lt;/div&gt;';}"
            >
            <span class="evidence-type-badge">${evidenceType}</span>
          </div>
          ${evidenceCaption ? `<p class="small evidence-caption">${escapeHtml(evidenceCaption)}</p>` : ''}
          ${evidenceSource ? `<p class="small evidence-source">${escapeHtml(evidenceSource)}</p>` : ''}
        </article>
      `
      : `<div class="media-placeholder evidence-placeholder" aria-label="Placeholder media panel">${fallbackLabel}</div>`;
    const missionImage = missionVisuals.hero.imagePath;
    const missionMedia = {
      src: missionImage,
      srcset: missionVisuals.hero.srcset || ''
    };
    const missionMediaAttrs = toResponsiveImageAttrs(missionMedia, '(max-width: 960px) 100vw, 480px');
    const missionMediaDimensions = toImageDimensionAttrs({ width: 1280, height: 720 });
    const missionAlt = getMeaningfulAltText(missionVisuals.hero.alt, `${mission.name} mission visual`);
    const missionCaption = missionVisuals.hero.caption || mission.exploration?.mediaLabel || 'Mission visual evidence';
    const missionSource = missionVisuals.hero.sourceLabel;
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
            onerror="if(!this.dataset.fallbackApplied && '${escapeHtml(missionVisuals.fallbackDistrictArt?.src || '')}'){this.dataset.fallbackApplied='1';this.src='${escapeHtml(missionVisuals.fallbackDistrictArt?.src || '')}';this.srcset='${escapeHtml(missionVisuals.fallbackDistrictArt?.srcset || '')}';}else{this.closest('figure').outerHTML='&lt;div class=&quot;media-placeholder&quot; aria-label=&quot;Placeholder media panel&quot;&gt;${fallbackLabel}&lt;/div&gt;';}"
          >
          <figcaption>
            <span class="mission-media-caption">${escapeHtml(missionCaption)}</span>
            ${missionSource ? `<span class="mission-media-source">${escapeHtml(missionSource)}</span>` : ''}
          </figcaption>
        </figure>
      `
      : `<div class="media-placeholder" aria-label="Placeholder media panel">${fallbackLabel}</div>`;

    return `
      <div class="scene-transition scene-briefing">
      ${renderTokenDashboard(state)}
      <section class="console-shell card mission-briefing">
        <h2>Mission Briefing: ${escapeHtml(mission.name)}</h2>
        ${renderRunProgress(state, runConfig.RUN_LENGTH)}
        <p class="pedagogy-objective"><strong>Learning Objective:</strong> ${escapeHtml(buildLearningObjective(mission))}</p>
        <p><strong>Impact Points Remaining:</strong> ${state.impactPointsRemaining}</p>
        <div class="grid two">
          <div class="brief-panel">
            ${evidenceCard}
            <h3>Current Situation</h3>
            <p>${escapeHtml(mission.exploration.brief)}</p>
            <ul>${points}</ul>
          </div>
          ${mediaPanel}
        </div>
        <button id="btnToDecision" class="btn">Proceed to Decision</button>
      </section>
      </div>
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
      <div class="scene-transition scene-decision">
      ${renderTokenDashboard(state)}
      <section class="console-shell card decision-card">
        <h2>Decision Point</h2>
        ${renderRunProgress(state, runConfig.RUN_LENGTH)}
        <p>Choose one strategy. Each option improves some categories while creating trade-offs.</p>
        <p><strong>Impact Points Remaining:</strong> ${state.impactPointsRemaining}</p>
        <div class="grid decision-grid" role="group" aria-label="Decision options">${optionButtons}</div>
      </section>
      <section id="feedbackContainer"></section>
      </div>
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
    const skillTags = normalizePedagogyTags(feedback.pedagogy);

    return `
      <section class="console-shell card feedback-card scene-transition scene-feedback" tabindex="-1">
        <h2>Outcome Feedback</h2>
        <p class="feedback-summary"><strong>Outcome in 1 sentence:</strong> ${escapeHtml(feedback.text)}</p>
        <p class="small feedback-flavor" aria-live="polite">${escapeHtml(buildFlavorLine(feedback, state))}</p>
        <p class="feedback-skill-practice"><strong>Skill practiced:</strong> ${renderSkillTagList(skillTags, 'good')}</p>
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
    const categoryEntries = Object.entries(state.categories);
    const improvedCategories = categoryEntries
      .filter(([, value]) => value > 0)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([key]) => CATEGORY_LABELS[key]);
    const practiceCategories = categoryEntries
      .sort((left, right) => left[1] - right[1])
      .slice(0, 2)
      .map(([key]) => CATEGORY_LABELS[key]);
    const mastery = computeMasteryTracker(state.decisionHistory || []);
    const weakestMastery = Object.entries(mastery)
      .sort((left, right) => left[1] - right[1])
      .slice(0, 2)
      .map(([dimension]) => toTitleCase(dimension));

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
        <h3>Reflection</h3>
        <p><strong>What you improved:</strong> ${escapeHtml(improvedCategories.join(' • ') || 'No category gains yet.')}</p>
        <p><strong>What to practice next:</strong> ${escapeHtml([...practiceCategories, ...weakestMastery].join(' • '))}</p>
        <div class="inline-actions">
          <button id="btnBackMap" class="btn secondary">Review Map</button>
          <button class="btn" onclick="window.print()">Export Report</button>
        </div>
      </section>
    `;
  }

  function renderDashboard(state, runConfig) {
    const cat = state.categories;
    const mastery = computeMasteryTracker(state.decisionHistory || []);
    const masteryItems = Object.entries(mastery)
      .map(([dimension, score]) => `<span class="tag ${score >= 2 ? 'good' : (score >= 1 ? 'warn' : 'bad')}">${escapeHtml(toTitleCase(dimension))}: ${escapeHtml(masteryTierLabel(score))}</span>`)
      .join('');

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
        <hr />
        <p><strong>Run Mastery Tracker:</strong></p>
        <div class="mastery-tag-row" aria-label="Run-level mastery tracker">${masteryItems}</div>
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
