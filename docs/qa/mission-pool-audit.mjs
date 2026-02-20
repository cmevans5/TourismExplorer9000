import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const missions = JSON.parse(fs.readFileSync(path.join(root, 'data/missions.json'), 'utf8')).missions;
const categories = ['economic', 'sustainability', 'culture', 'hospitality', 'satisfaction'];

const scoringSource = fs.readFileSync(path.join(root, 'js/scoring.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(scoringSource, sandbox);
const scoring = sandbox.window.TE9000Scoring;

function evalPath(pathChoices) {
  const totals = Object.fromEntries(categories.map((k) => [k, 0]));
  pathChoices.forEach((option, idx) => {
    const mission = missions[idx];
    const found = mission.options.find((o) => o.id === option);
    categories.forEach((k) => {
      totals[k] += found.deltas[k];
    });
  });
  const variance = scoring.computeVariance(totals);
  const BII = Math.round(scoring.computeBII(totals, { remainingImpactPoints: 0, totalSpent: 0 }, scoring.SCORING_CONSTANTS).BII);
  const gate = scoring.checkTopGate(totals, variance, { completedHotspots: pathChoices.length, totalRemainingImpactPoints: 0 }, scoring.SCORING_CONSTANTS);
  return { totals, variance, BII, gate };
}

// 1) pool size
assert.ok(missions.length >= 15 && missions.length <= 20, 'Mission count must be between 15 and 20.');

// 2) unique ids
assert.equal(new Set(missions.map((m) => m.id)).size, missions.length, 'Mission ids must be unique.');

// 3) hub coverage
const hubs = new Map();
missions.forEach((m) => hubs.set(m.hub, (hubs.get(m.hub) || 0) + 1));
assert.ok(hubs.size >= 6 && hubs.size <= 8, 'Hub count must be between 6 and 8.');
for (const [hub, count] of hubs) {
  assert.ok(count >= 2 && count <= 3, `Hub ${hub} must have 2-3 cases.`);
}

// 4) structure checks
missions.forEach((mission) => {
  assert.equal(typeof mission.issueType, 'string');
  assert.ok(mission.pedagogy && Array.isArray(mission.pedagogy.tags));
  assert.ok(Array.isArray(mission.pedagogy.reinforces));
  assert.ok(Array.isArray(mission.pedagogy.commonPitfalls));
  assert.equal(typeof mission.pedagogy.difficulty, 'string');
  assert.ok(mission.exploration && Array.isArray(mission.exploration.bullets));
  assert.ok(typeof mission.exploration.mediaLabel === 'string');
  assert.equal(mission.options.length, 3, `${mission.id} must have exactly 3 options.`);
  ['A', 'B', 'C'].forEach((id) => assert.ok(mission.options.some((o) => o.id === id), `${mission.id} must include option ${id}.`));
  mission.options.forEach((option) => {
    assert.equal(typeof option.cost, 'number');
    categories.forEach((k) => assert.equal(typeof option.deltas[k], 'number'));
  });
});

// 5) adaptive tagging hooks
assert.ok(missions.some((m) => m.pedagogy.tags.includes('remediation')), 'Need remediation-tagged missions.');
assert.ok(missions.some((m) => m.pedagogy.tags.includes('consequence-followup')), 'Need consequence follow-up missions.');
assert.ok(missions.some((m) => m.pedagogy.tags.includes('variety')), 'Need variety-tagged missions.');

// 6) diversity guard: avoid same hub 3x in a row in sorted order
for (let i = 0; i < missions.length - 2; i += 1) {
  const a = missions[i].hub;
  const b = missions[i + 1].hub;
  const c = missions[i + 2].hub;
  assert.ok(!(a === b && b === c), `Mission ordering violates variety at index ${i}.`);
}

// 7) prerequisite hooks present on subset
assert.ok(missions.some((m) => m.prerequisites && m.prerequisites.minDecisions > 0), 'Expected prerequisite minDecisions hooks.');

// 8) 9-case achievability search (first 9 adaptive cases)
const sampleLen = 9;
const sample = missions.slice(0, sampleLen);
let topCount = 0;
let total = 0;
let oneTopPath = null;
for (const a of sample[0].options) for (const b of sample[1].options) for (const c of sample[2].options)
for (const d of sample[3].options) for (const e of sample[4].options) for (const f of sample[5].options)
for (const g of sample[6].options) for (const h of sample[7].options) for (const i of sample[8].options) {
  const ids = [a.id,b.id,c.id,d.id,e.id,f.id,g.id,h.id,i.id];
  const result = evalPath(ids);
  total += 1;
  if (result.gate && result.BII >= scoring.SCORING_CONSTANTS.ratingThresholds.top) {
    topCount += 1;
    if (!oneTopPath) oneTopPath = { ids, result };
  }
}
assert.ok(topCount >= 1, 'At least one Top Analyst path must exist over ~9 cases.');

// 9) rarity check
const share = topCount / total;
assert.ok(share <= 0.08, `Top Analyst should remain rare in sample run; got ${(share * 100).toFixed(2)}%.`);

// 10) explicit near miss
const nearMiss = evalPath(['B','B','B','A','A','B','A','B','A']);
assert.equal(nearMiss.gate, false, 'Near-miss path should fail top gate.');

console.log('Mission count:', missions.length);
console.log('Hub distribution:', Object.fromEntries(hubs));
console.log(`9-case sample top paths: ${topCount}/${total} (${(share * 100).toFixed(2)}%)`);
console.log('One valid Top path example:', oneTopPath?.ids.join(' -> '), oneTopPath?.result);
console.log('Near miss:', nearMiss);
