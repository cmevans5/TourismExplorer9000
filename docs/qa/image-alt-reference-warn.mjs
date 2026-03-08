import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const uiFile = path.join(root, 'js/ui.js');
const missionsFile = path.join(root, 'data/missions.json');

const warnings = [];

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function warn(message) {
  warnings.push(message);
}

function extractObjectBlock(source, blockName) {
  const token = `const ${blockName} = {`;
  const start = source.indexOf(token);
  if (start === -1) {
    warn(`Could not locate ${blockName} in js/ui.js.`);
    return [];
  }

  const blockStart = source.indexOf('{', start);
  let depth = 0;
  let blockEnd = -1;
  for (let index = blockStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        blockEnd = index;
        break;
      }
    }
  }

  if (blockEnd === -1) {
    warn(`Unable to parse ${blockName} boundaries in js/ui.js.`);
    return [];
  }

  const block = source.slice(blockStart + 1, blockEnd);
  const entryRegex = /'([^']+)'\s*:\s*\{([\s\S]*?)\n\s*\}/g;
  const entries = [];
  let match;
  while ((match = entryRegex.exec(block))) {
    entries.push({ key: match[1], body: match[2] });
  }

  return entries;
}

function readStringProp(body, prop) {
  const propRegex = new RegExp(`${prop}\\s*:\\s*'([^']*)'`);
  const match = body.match(propRegex);
  return match ? match[1].trim() : '';
}

function checkUiMedia(source) {
  for (const blockName of ['MISSION_MEDIA', 'DISTRICT_MEDIA']) {
    const entries = extractObjectBlock(source, blockName);
    entries.forEach(({ key, body }) => {
      const src = readStringProp(body, 'src');
      const alt = readStringProp(body, 'alt');
      if (!src) {
        warn(`${blockName}.${key} has no src value.`);
      }
      if (!alt) {
        warn(`${blockName}.${key} has no meaningful alt value.`);
      }
    });
  }
}

function checkMissionEvidence() {
  const missionsData = JSON.parse(readFile(missionsFile));
  const missions = Array.isArray(missionsData.missions) ? missionsData.missions : [];

  missions.forEach((mission) => {
    const media = mission?.media || {};
    ['hero', 'thumbnail', 'fallbackDistrictArt', 'evidenceChart'].forEach((blockKey) => {
      const block = media?.[blockKey];
      if (!block || typeof block !== 'object') return;
      if (!String(block.imagePath || '').trim()) {
        warn(`Mission ${mission.id} media.${blockKey} is missing imagePath.`);
      }
      if (!String(block.alt || '').trim()) {
        warn(`Mission ${mission.id} media.${blockKey} is missing alt text.`);
      }
      if (!String(block.caption || '').trim()) {
        warn(`Mission ${mission.id} media.${blockKey} is missing caption.`);
      }
    });
  });
}

function checkTemplateReferences(source) {
  if (!source.includes('class="hotspot-hero-strip" aria-hidden="true"')) {
    warn('Map mission detail hero strip is expected to be aria-hidden (decorative context image).');
  }

  const decorativeThumbHasEmptyAlt = source.includes('alt=""');
  const decorativeThumbIsLazyLoaded = source.includes('loading="lazy"');
  const decorativeThumbHasDimensions = source.includes('${heroStripDimensions}') || source.includes('${thumbnailDimensions}');
  if (!decorativeThumbHasEmptyAlt || !decorativeThumbIsLazyLoaded || !decorativeThumbHasDimensions) {
    warn('Decorative hero-strip image should include empty alt, lazy loading, and explicit width/height attrs.');
  }

  if (!source.includes('alt="${escapeHtml(evidenceAlt)}"')) {
    warn('Mission evidence image alt binding (evidenceAlt) was not found.');
  }

  if (!source.includes('alt="${escapeHtml(missionAlt)}"')) {
    warn('Mission media image alt binding (missionAlt) was not found.');
  }
}

const uiSource = readFile(uiFile);
checkUiMedia(uiSource);
checkMissionEvidence();
checkTemplateReferences(uiSource);

if (!warnings.length) {
  console.log('Image metadata warning audit passed (no issues detected).');
  process.exit(0);
}

console.warn('Image metadata warning audit found potential issues:');
warnings.forEach((message) => console.warn(` - ${message}`));
process.exit(0);
