import fs from 'node:fs';
import path from 'node:path';

const STRICT = process.argv.includes('--strict');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');

const missions = JSON.parse(fs.readFileSync(path.join(root, 'data/missions.json'), 'utf8')).missions || [];
const uiSource = fs.readFileSync(path.join(root, 'js/ui.js'), 'utf8');

const LIMITS = {
  missionName: 62,
  missionDescription: 145,
  optionTitle: 78,
  explorationBullet: 160,
  explorationBrief: 220,
  explorationMediaLabel: 72,
  feedbackSummary: 95,
  learningNote: 150
};

const warnings = [];

function warn(message) {
  warnings.push(message);
}

function parseDistrictLabels(source) {
  const match = source.match(/const\s+DISTRICT_LABELS\s*=\s*({[\s\S]*?})\s*;/);
  if (!match) {
    warn('Could not parse DISTRICT_LABELS from js/ui.js.');
    return {};
  }

  try {
    return Function(`"use strict"; return (${match[1]});`)();
  } catch (error) {
    warn(`Failed to evaluate DISTRICT_LABELS from js/ui.js: ${error.message}`);
    return {};
  }
}

function checkDuplicateDistrictLabels(labelsByKey) {
  const byLabel = new Map();
  Object.entries(labelsByKey).forEach(([districtKey, label]) => {
    const normalized = String(label || '').trim().toLowerCase();
    if (!normalized) return;
    const existing = byLabel.get(normalized) || [];
    existing.push(districtKey);
    byLabel.set(normalized, existing);
  });

  for (const [normalizedLabel, districtKeys] of byLabel.entries()) {
    if (districtKeys.length > 1) {
      warn(`Duplicate district label "${normalizedLabel}" used by keys: ${districtKeys.join(', ')}`);
    }
  }
}

function checkOptionTitleArtifacts(mission) {
  (mission.options || []).forEach((option, idx) => {
    const expectedLabel = String.fromCharCode(65 + idx);
    const title = String(option?.title || '').trim();
    const pathLabel = `${mission.id}:option[${idx}]`;

    if (!title) return;

    if (/^[A-C][\)\.:\-]\s*/i.test(title)) {
      warn(`${pathLabel} title still includes a raw option prefix: "${title}"`);
    }

    if (new RegExp(`\\b${expectedLabel}[\\)\\.:\\-]`, 'i').test(title)) {
      warn(`${pathLabel} title appears to include expected label artifact (${expectedLabel}): "${title}"`);
    }

    if (/\b[A-C][\)\.:\-]\s+[A-C][\)\.:\-]/i.test(title)) {
      warn(`${pathLabel} title appears to include stacked/duplicated labels: "${title}"`);
    }
  });
}

function checkLength(value, limit, label) {
  const text = String(value || '').trim();
  if (!text) return;
  if (text.length > limit) {
    warn(`${label} is ${text.length} chars (limit ${limit}): "${text}"`);
  }
}


function checkImageCopyQuality(mission) {
  const media = mission?.media || {};
  const blocks = ['hero', 'thumbnail', 'fallbackDistrictArt', 'evidenceChart'];

  blocks.forEach((blockKey) => {
    const block = media[blockKey];
    if (!block || typeof block !== 'object') return;

    const alt = String(block.alt || '').trim();
    const caption = String(block.caption || '').trim();
    const sourceLabel = String(block.sourceLabel || '').trim();

    if (!alt) {
      warn(`${mission.id} media.${blockKey}.alt is missing.`);
    }

    if (!caption) {
      warn(`${mission.id} media.${blockKey}.caption is empty.`);
    }

    if (!sourceLabel) {
      warn(`${mission.id} media.${blockKey}.sourceLabel is empty.`);
    }
  });
}

function checkCardOverflowRisk(mission) {
  checkLength(mission.name, LIMITS.missionName, `${mission.id} mission.name`);
  checkLength(mission.description, LIMITS.missionDescription, `${mission.id} mission.description`);

  (mission.options || []).forEach((option, idx) => {
    checkLength(option?.title, LIMITS.optionTitle, `${mission.id}:option[${idx}] title`);
    checkLength(option?.feedback, LIMITS.feedbackSummary, `${mission.id}:option[${idx}] feedback`);
    checkLength(option?.learningNote, LIMITS.learningNote, `${mission.id}:option[${idx}] learningNote`);
  });

  checkLength(mission.exploration?.brief, LIMITS.explorationBrief, `${mission.id} exploration.brief`);
  checkLength(mission.exploration?.mediaLabel, LIMITS.explorationMediaLabel, `${mission.id} exploration.mediaLabel`);

  (mission.exploration?.bullets || []).forEach((bullet, idx) => {
    checkLength(bullet, LIMITS.explorationBullet, `${mission.id} exploration.bullets[${idx}]`);
  });
}

const districtLabels = parseDistrictLabels(uiSource);
checkDuplicateDistrictLabels(districtLabels);
missions.forEach(mission => {
  checkOptionTitleArtifacts(mission);
  checkCardOverflowRisk(mission);
  checkImageCopyQuality(mission);
});

if (warnings.length) {
  console.warn(`mission-copy-audit: WARN (${warnings.length} findings)`);
  warnings.forEach(message => console.warn(` - ${message}`));

  if (STRICT) {
    console.error('mission-copy-audit: FAIL (--strict enabled)');
    process.exit(1);
  }

  console.warn('mission-copy-audit: non-blocking mode (use --strict to fail on warnings).');
} else {
  console.log('mission-copy-audit: PASS (no findings)');
}
