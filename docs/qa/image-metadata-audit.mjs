import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const uiFile = path.join(root, 'js/ui.js');
const missionsFile = path.join(root, 'data/missions.json');

const errors = [];

function fileExists(relPath) {
  if (!relPath) return false;
  return fs.existsSync(path.join(root, relPath));
}

function parseMediaBlock(source, blockName) {
  const startToken = `const ${blockName} = {`;
  const start = source.indexOf(startToken);
  if (start === -1) {
    errors.push(`Unable to locate ${blockName} block in js/ui.js`);
    return [];
  }

  const blockStart = source.indexOf('{', start);
  let depth = 0;
  let end = -1;
  for (let i = blockStart; i < source.length; i += 1) {
    const char = source[i];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1) {
    errors.push(`Unable to parse ${blockName} object boundaries.`);
    return [];
  }

  const block = source.slice(blockStart + 1, end);
  const entryRegex = /'([^']+)'\s*:\s*\{([\s\S]*?)\n\s*\}/g;
  const entries = [];
  let match;
  while ((match = entryRegex.exec(block))) {
    entries.push({ key: match[1], body: match[2] });
  }
  if (!entries.length) {
    errors.push(`No entries discovered in ${blockName}.`);
  }
  return entries;
}

function readStringProp(body, prop) {
  const regex = new RegExp(`${prop}\\s*:\\s*'([^']*)'`);
  const match = body.match(regex);
  return match ? match[1].trim() : '';
}

function validateUiMappings() {
  const source = fs.readFileSync(uiFile, 'utf8');
  for (const blockName of ['MISSION_MEDIA', 'DISTRICT_MEDIA']) {
    const entries = parseMediaBlock(source, blockName);
    entries.forEach(({ key, body }) => {
      const src = readStringProp(body, 'src');
      const alt = readStringProp(body, 'alt');

      if (!src) {
        errors.push(`${blockName}.${key} is missing a src path.`);
      } else if (!fileExists(src)) {
        errors.push(`${blockName}.${key} references missing asset: ${src}`);
      }

      if (!alt) {
        errors.push(`${blockName}.${key} is missing a non-empty alt text key.`);
      }
    });
  }
}

function validateMissionEvidence() {
  const missions = JSON.parse(fs.readFileSync(missionsFile, 'utf8')).missions || [];
  missions.forEach((mission) => {
    const evidence = mission?.exploration?.visualEvidence;
    if (!evidence) return;

    const imagePath = String(evidence.imagePath || '').trim();
    const alt = String(evidence.alt || '').trim();

    if (!imagePath) {
      errors.push(`Mission ${mission.id} visualEvidence is missing imagePath.`);
    } else if (!fileExists(imagePath)) {
      errors.push(`Mission ${mission.id} visualEvidence references missing asset: ${imagePath}`);
    }

    if (!alt) {
      errors.push(`Mission ${mission.id} visualEvidence is missing alt metadata key.`);
    }
  });
}

validateUiMappings();
validateMissionEvidence();

if (errors.length) {
  console.error('Image metadata QA checks failed:');
  errors.forEach((error) => console.error(` - ${error}`));
  process.exit(1);
}

console.log('Image metadata QA checks passed (assets exist and alt metadata keys are present).');
