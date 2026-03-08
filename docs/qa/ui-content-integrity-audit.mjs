import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const missionsFile = path.join(root, 'data/missions.json');
const uiFile = path.join(root, 'js/ui.js');

const warnings = [];

function warn(message) {
  warnings.push(message);
}

function isMeaningfulText(value) {
  return typeof value === 'string' && value.trim().length >= 3;
}

function validateMissionMediaMetadata(missions) {
  missions.forEach((mission) => {
    const details = mission?.exploration || {};
    const context = `Mission ${mission?.id || '(missing-id)'}`;

    if (!isMeaningfulText(details.brief)) {
      warn(`${context} has a missing/short exploration.brief.`);
    }

    if (!Array.isArray(details.bullets) || !details.bullets.length) {
      warn(`${context} has no exploration.bullets.`);
    }

    const imagePath = String(details.image || details?.visualEvidence?.imagePath || '').trim();
    const alt = String(details.alt || details?.visualEvidence?.alt || '').trim();
    const caption = String(details.caption || details?.visualEvidence?.caption || '').trim();

    if (imagePath && !isMeaningfulText(alt)) {
      warn(`${context} includes an image but is missing meaningful alt text.`);
    }

    if (imagePath && !isMeaningfulText(caption)) {
      warn(`${context} includes an image but is missing a meaningful caption.`);
    }

    if (imagePath) {
      const absolute = path.join(root, imagePath);
      if (!fs.existsSync(absolute)) {
        warn(`${context} references a missing image asset: ${imagePath}`);
      }
    }

    const media = mission?.media || {};
    ['hero', 'thumbnail', 'fallbackDistrictArt', 'evidenceChart'].forEach((blockKey) => {
      const block = media?.[blockKey];
      if (!block || typeof block !== 'object') return;

      const mediaPath = String(block.imagePath || '').trim();
      const mediaAlt = String(block.alt || '').trim();
      const mediaCaption = String(block.caption || '').trim();

      if (mediaPath && !isMeaningfulText(mediaAlt)) {
        warn(`${context} media.${blockKey} is missing meaningful alt text.`);
      }

      if (mediaPath && !isMeaningfulText(mediaCaption)) {
        warn(`${context} media.${blockKey} is missing a meaningful caption.`);
      }
    });
  });
}

function validateUiMediaHints(uiSource) {
  if (!uiSource.includes('fetchpriority="low"')) {
    warn('Non-critical UI images are expected to include fetchpriority="low".');
  }

  if (!uiSource.includes('toImageDimensionAttrs(')) {
    warn('UI image templates should include explicit width/height attrs via toImageDimensionAttrs.');
  }
}

function validateOptionIntegrity(missions) {
  missions.forEach((mission) => {
    const options = Array.isArray(mission?.options) ? mission.options : [];
    const context = `Mission ${mission?.id || '(missing-id)'}`;

    if (options.length !== 3) {
      warn(`${context} should provide exactly 3 options (found ${options.length}).`);
    }

    options.forEach((option, index) => {
      if (!isMeaningfulText(option?.title)) {
        warn(`${context} option[${index}] is missing a meaningful title.`);
      }
      if (!isMeaningfulText(option?.feedback)) {
        warn(`${context} option[${index}] is missing meaningful feedback text.`);
      }
      if (typeof option?.cost !== 'number') {
        warn(`${context} option[${index}] is missing a numeric cost.`);
      }
      if (!option?.deltas || typeof option.deltas !== 'object') {
        warn(`${context} option[${index}] is missing delta metadata.`);
      }
    });
  });
}

const missions = JSON.parse(fs.readFileSync(missionsFile, 'utf8')).missions || [];
const uiSource = fs.readFileSync(uiFile, 'utf8');

validateMissionMediaMetadata(missions);
validateUiMediaHints(uiSource);
validateOptionIntegrity(missions);

if (!warnings.length) {
  console.log('ui-content-integrity-audit: PASS (no obvious media/content integrity issues detected)');
  process.exit(0);
}

console.warn(`ui-content-integrity-audit: WARN (${warnings.length} findings)`);
warnings.forEach((message) => console.warn(` - ${message}`));
process.exit(0);
