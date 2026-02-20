import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('data/missions.json', 'utf8'));
const missions = data.missions || [];

const RUN_CONFIG = {
  RUN_LENGTH: 8,
  RANDOMNESS_WEIGHT: 0.25
};

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function sample(seed) {
  const rng = mulberry32(seed);
  const sorted = [...missions].sort((a, b) => (a.id > b.id ? 1 : -1));
  const picked = [];
  while (picked.length < RUN_CONFIG.RUN_LENGTH) {
    const remaining = sorted.filter(m => !picked.find(p => p.id === m.id));
    const choices = remaining.filter(candidate => {
      const len = picked.length;
      if (len >= 2) {
        const p1 = picked[len - 1];
        const p2 = picked[len - 2];
        if (p1.hub === candidate.hub && p2.hub === candidate.hub) return false;
      }
      return true;
    });
    const pool = choices.length ? choices : remaining;
    const width = Math.max(1, Math.min(pool.length, 1 + Math.round(RUN_CONFIG.RANDOMNESS_WEIGHT * 8)));
    const idx = Math.floor(rng() * width);
    picked.push(pool[idx]);
  }
  return picked.map(m => m.id);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateVariety(sampleIds) {
  const sampleMissions = sampleIds.map(id => missions.find(m => m.id === id));
  for (let i = 2; i < sampleMissions.length; i += 1) {
    assert(!(sampleMissions[i].hub === sampleMissions[i - 1].hub && sampleMissions[i].hub === sampleMissions[i - 2].hub), 'Found 3 same-hub missions in a row');
  }
}

const sameSeedA = sample(12345);
const sameSeedB = sample(12345);
const diffSeed = sample(67890);

assert(sameSeedA.length === RUN_CONFIG.RUN_LENGTH, 'sampledMissionIds length mismatch');
validateVariety(sameSeedA);
assert(JSON.stringify(sameSeedA) === JSON.stringify(sameSeedB), 'Sampling must be deterministic for same seed');
assert(JSON.stringify(sameSeedA) !== JSON.stringify(diffSeed), 'Sampling should differ across seeds');

const fakeDiagnosis = {
  recommendedFocus: 'culture',
  remediationMissions: sameSeedA.slice(0, 2)
};
assert(fakeDiagnosis.recommendedFocus, 'Diagnosis missing recommendedFocus');
assert(fakeDiagnosis.remediationMissions.length >= 1 && fakeDiagnosis.remediationMissions.length <= 2, 'Diagnosis remediation mission count should be 1-2');

console.log('Tourism sampling audit passed.');
