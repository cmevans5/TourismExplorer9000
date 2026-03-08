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
  optionDescription: 170,
  explorationBullet: 160,
  explorationBrief: 220,
  explorationMediaLabel: 72,
  feedbackSummary: 95,
  learningNote: 150
};

const READABILITY_RULES = {
  maxSentenceWords: 28,
  maxWordLength: 18,
  minAverageWordLength: 3.2,
  maxAverageWordLength: 6.8
};

const FORMAL_VOICE_PATTERNS = [
  /\bmoreover\b/i,
  /\btherefore\b/i,
  /\bfurthermore\b/i,
  /\bhenceforth\b/i,
  /\bpursuant to\b/i,
  /\bin accordance with\b/i,
  /\butili[sz]e\b/i,
  /\bleverage\b/i,
  /\bstakeholders\b/i,
  /\bmitigation strategy\b/i,
  /\boptimi[sz]e\b/i,
  /\bcommence\b/i,
  /\bfacilitate\b/i,
  /\bwhereas\b/i
];

const warnings = [];

function warn(message) {
  warnings.push(message);
}

function normalizePhrase(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeWords(value) {
  return String(value || '').match(/[A-Za-z']+/g) || [];
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
    const normalized = normalizePhrase(label);
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

function checkReadability(text, label) {
  const clean = String(text || '').trim();
  if (!clean) return;

  const words = tokenizeWords(clean);
  if (!words.length) return;

  const sentences = clean
    .split(/[.!?]+/)
    .map(chunk => chunk.trim())
    .filter(Boolean);

  for (const sentence of sentences) {
    const sentenceWords = tokenizeWords(sentence);
    if (sentenceWords.length > READABILITY_RULES.maxSentenceWords) {
      warn(`${label} readability: sentence is too long (${sentenceWords.length} words).`);
      break;
    }
  }

  const longestWord = words.reduce((max, word) => Math.max(max, word.length), 0);
  if (longestWord > READABILITY_RULES.maxWordLength) {
    warn(`${label} readability: contains hard-to-scan word length ${longestWord} (max ${READABILITY_RULES.maxWordLength}).`);
  }

  const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  if (averageWordLength < READABILITY_RULES.minAverageWordLength || averageWordLength > READABILITY_RULES.maxAverageWordLength) {
    warn(`${label} readability: average word length ${averageWordLength.toFixed(1)} is outside ${READABILITY_RULES.minAverageWordLength}-${READABILITY_RULES.maxAverageWordLength}.`);
  }
}

function checkVoiceTone(text, label) {
  const clean = String(text || '').trim();
  if (!clean) return;

  FORMAL_VOICE_PATTERNS.forEach((pattern) => {
    if (pattern.test(clean)) {
      warn(`${label} voice: avoid over-formal phrasing matched by ${pattern}.`);
    }
  });
}

function checkDuplicateLearningCopy(mission) {
  const seenFeedback = new Map();
  const seenLearning = new Map();

  (mission.options || []).forEach((option, idx) => {
    const optionLabel = `${mission.id}:option[${idx}]`;
    const feedback = normalizePhrase(option?.feedback);
    const learningNote = normalizePhrase(option?.learningNote);

    if (feedback) {
      const existing = seenFeedback.get(feedback);
      if (existing) {
        warn(`${optionLabel} feedback duplicates ${existing}.`);
      } else {
        seenFeedback.set(feedback, optionLabel);
      }
    }

    if (learningNote) {
      const existing = seenLearning.get(learningNote);
      if (existing) {
        warn(`${optionLabel} learningNote duplicates ${existing}.`);
      } else {
        seenLearning.set(learningNote, optionLabel);
      }
    }
  });
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

function checkContrastiveOutcomes(mission) {
  const options = mission.options || [];
  const signatures = options.map(option => {
    const deltas = option?.deltas || {};
    return ['economic', 'sustainability', 'culture', 'hospitality', 'satisfaction']
      .map((key) => Number(deltas[key] || 0))
      .join('|');
  });

  const uniqueSignatures = new Set(signatures);
  if (uniqueSignatures.size < options.length) {
    warn(`${mission.id} outcomes: at least two options share identical category deltas.`);
  }

  let closestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < options.length; i += 1) {
    for (let j = i + 1; j < options.length; j += 1) {
      const a = options[i]?.deltas || {};
      const b = options[j]?.deltas || {};
      const distance = Math.abs((a.economic || 0) - (b.economic || 0))
        + Math.abs((a.sustainability || 0) - (b.sustainability || 0))
        + Math.abs((a.culture || 0) - (b.culture || 0))
        + Math.abs((a.hospitality || 0) - (b.hospitality || 0))
        + Math.abs((a.satisfaction || 0) - (b.satisfaction || 0));
      closestDistance = Math.min(closestDistance, distance);
    }
  }

  if (Number.isFinite(closestDistance) && closestDistance <= 2) {
    warn(`${mission.id} outcomes: option deltas are very similar (minimum distance ${closestDistance}). Add stronger contrasts.`);
  }
}

function checkCardOverflowRisk(mission) {
  checkLength(mission.name, LIMITS.missionName, `${mission.id} mission.name`);
  checkLength(mission.description, LIMITS.missionDescription, `${mission.id} mission.description`);
  checkReadability(mission.name, `${mission.id} mission.name`);
  checkReadability(mission.description, `${mission.id} mission.description`);
  checkVoiceTone(mission.name, `${mission.id} mission.name`);
  checkVoiceTone(mission.description, `${mission.id} mission.description`);

  (mission.options || []).forEach((option, idx) => {
    const label = `${mission.id}:option[${idx}]`;

    checkLength(option?.title, LIMITS.optionTitle, `${label} title`);
    checkLength(option?.description, LIMITS.optionDescription, `${label} description`);
    checkLength(option?.feedback, LIMITS.feedbackSummary, `${label} feedback`);
    checkLength(option?.learningNote, LIMITS.learningNote, `${label} learningNote`);

    checkReadability(option?.title, `${label} title`);
    checkReadability(option?.description, `${label} description`);
    checkReadability(option?.feedback, `${label} feedback`);
    checkReadability(option?.learningNote, `${label} learningNote`);

    checkVoiceTone(option?.title, `${label} title`);
    checkVoiceTone(option?.description, `${label} description`);
    checkVoiceTone(option?.feedback, `${label} feedback`);
    checkVoiceTone(option?.learningNote, `${label} learningNote`);
  });

  checkLength(mission.exploration?.brief, LIMITS.explorationBrief, `${mission.id} exploration.brief`);
  checkLength(mission.exploration?.mediaLabel, LIMITS.explorationMediaLabel, `${mission.id} exploration.mediaLabel`);
  checkReadability(mission.exploration?.brief, `${mission.id} exploration.brief`);
  checkReadability(mission.exploration?.mediaLabel, `${mission.id} exploration.mediaLabel`);

  (mission.exploration?.bullets || []).forEach((bullet, idx) => {
    checkLength(bullet, LIMITS.explorationBullet, `${mission.id} exploration.bullets[${idx}]`);
    checkReadability(bullet, `${mission.id} exploration.bullets[${idx}]`);
  });
}

const districtLabels = parseDistrictLabels(uiSource);
checkDuplicateDistrictLabels(districtLabels);
missions.forEach(mission => {
  checkOptionTitleArtifacts(mission);
  checkCardOverflowRisk(mission);
  checkDuplicateLearningCopy(mission);
  checkContrastiveOutcomes(mission);
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
