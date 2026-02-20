import fs from 'fs';
import assert from 'assert/strict';

function hashString(value) {
  let h = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function createRunRng(runSeed) {
  return mulberry32(hashString(runSeed));
}

function shuffledOptionOrder(runSeed, missionId) {
  const rng = createRunRng(`${runSeed}:${missionId}:decision-options`);
  const ids = ['A', 'B', 'C'];
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = ids[i];
    ids[i] = ids[j];
    ids[j] = tmp;
  }
  return ids;
}

const missions = JSON.parse(fs.readFileSync('data/missions.json', 'utf8')).missions;

const missionIds = missions.map(m => m.id);
const seed = 12345;

for (const missionId of missionIds) {
  const first = shuffledOptionOrder(seed, missionId).join('');
  const second = shuffledOptionOrder(seed, missionId).join('');
  assert.equal(first, second, `Shuffle must be stable for seed=${seed}, mission=${missionId}`);
}

const seedA = 11111;
const seedB = 99999;
const changed = missionIds.filter(missionId => shuffledOptionOrder(seedA, missionId).join('') !== shuffledOptionOrder(seedB, missionId).join(''));
assert.ok(changed.length > 0, 'At least one mission shuffle should differ across run seeds');

console.log(`option-shuffle-audit: PASS (${changed.length}/${missionIds.length} missions changed across seeds)`);
