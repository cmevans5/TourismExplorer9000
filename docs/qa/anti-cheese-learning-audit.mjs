import fs from 'fs';
import vm from 'vm';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadBrowserScript(path, context) {
  const code = fs.readFileSync(path, 'utf8');
  vm.runInContext(code, context, { filename: path });
}

const context = vm.createContext({
  console,
  window: {},
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  }
});

loadBrowserScript('js/scoring.js', context);
loadBrowserScript('js/adaptation.js', context);
loadBrowserScript('js/ui.js', context);

const { SCORING_CONSTANTS } = context.window.TE9000Scoring;
const { RUN_CONFIG, generateOfferSet, createRunRng } = context.window.TE9000Adaptation;
const UI = context.window.TE9000UI;
const missions = JSON.parse(fs.readFileSync('data/missions.json', 'utf8')).missions;
const appSource = fs.readFileSync('js/app.js', 'utf8');

function roleCounts(rolesById, ids) {
  return ids.reduce((acc, id) => {
    const role = rolesById[id];
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
}

function shuffleOfferDisplay(ids, runSeed, step) {
  const rng = createRunRng(`${runSeed}:${step}:offer-order`);
  const shuffled = ids.slice();
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

function buildOfferForStep(baseState, step) {
  const state = { ...baseState, casesCompletedThisRun: step };
  const offer = generateOfferSet(missions, state, SCORING_CONSTANTS, RUN_CONFIG, createRunRng(`${state.runSeed}:${step}:${state.completedMissionIds.join(',')}`));
  const shuffledIds = shuffleOfferDisplay(offer.offerMissionIds, state.runSeed, step);
  return { offer, shuffledIds, state };
}

const baseState = {
  categories: { economic: 3, sustainability: -2, culture: 0, hospitality: 1, satisfaction: -1 },
  completedMissionIds: [],
  lastChosenHub: 'Riverwalk',
  lastChosenIssueType: 'Mobility',
  decisionCount: 4,
  impactPointsSpent: 140,
  BII: 56,
  runSeed: 777331
};

for (let step = 0; step < 4; step += 1) {
  const { offer, shuffledIds, state } = buildOfferForStep(baseState, step);
  const counts = roleCounts(offer.rolesById, offer.offerMissionIds);
  assert(offer.offerMissionIds.length === 4, `Step ${step}: offer size must be 4`);
  assert((counts.recommended || 0) === 2, `Step ${step}: requires 2 recommended`);
  assert((counts.challenge || 0) === 1, `Step ${step}: requires 1 challenge`);
  assert((counts.wildcard || 0) === 1, `Step ${step}: requires 1 wildcard`);
  shuffledIds.forEach(id => assert(!state.completedMissionIds.includes(id), `Step ${step}: completed mission repeated (${id})`));
}

const sameStepA = buildOfferForStep(baseState, 2);
const sameStepB = buildOfferForStep(baseState, 2);
assert(JSON.stringify(sameStepA.shuffledIds) === JSON.stringify(sameStepB.shuffledIds), 'Same seed + step must keep offer display order deterministic');

const step0 = buildOfferForStep(baseState, 0).shuffledIds;
const step1 = buildOfferForStep(baseState, 1).shuffledIds;
const canVary = step0.some((id, index) => step1[index] !== id);
assert(canVary || JSON.stringify(step0.slice().sort()) !== JSON.stringify(step1.slice().sort()), 'Offer order should vary by step when possible');

assert(appSource.includes('offer-order'), 'app.js must include seeded offer-order shuffle key');
assert(appSource.includes('trackPatternGamingNudge(displayLabel);'), 'app.js must track repeated presentation label picks');

const decisionHtml = UI.renderDecision(
  {
    name: 'Test mission',
    options: [],
    exploration: { bullets: [] }
  },
  { impactPointsRemaining: 100, casesCompletedThisRun: 0 },
  RUN_CONFIG,
  [
    { displayLabel: 'A', title: 'C) Original key leak test', description: 'desc', cost: 10 },
    { displayLabel: 'B', title: 'A. Prefix leak test', description: 'desc', cost: 10 },
    { displayLabel: 'C', title: 'B: Prefix leak test', description: 'desc', cost: 10 }
  ]
);
assert(decisionHtml.includes('A) Original key leak test'), 'Decision should render only presentation label A once');
assert(!decisionHtml.includes('A) C)'), 'Decision leaked original option key');
assert(!decisionHtml.includes('B) A.'), 'Decision leaked original option prefix');

missions.forEach(mission => {
  (mission.options || []).forEach(option => {
    assert(String(option.learningNote || '').trim().length > 0, `Missing learningNote: ${mission.id}/${option.id}`);
  });
});

const feedbackHtml = UI.renderFeedback(
  {
    text: 'Outcome text',
    deltas: { economic: 2, sustainability: -1, culture: 0, hospitality: 1, satisfaction: 0 },
    poorOutcome: false,
    impactCost: 35,
    learningNote: 'Learning note sample.',
    systemInsight: 'System insight sample.',
    tradeoffSpotlight: 'Trade-off spotlight sample.'
  },
  {
    impactPointsRemaining: 65,
    minCategory: -1,
    variance: 4,
    topGateLockReason: 'variance must be 3 or lower'
  }
);
assert(feedbackHtml.includes('Learning note sample.'), 'learningNote should render and be non-empty');
assert(feedbackHtml.includes('System insight sample.'), 'systemInsight should render and be non-empty');
assert(feedbackHtml.includes('Trade-off spotlight sample.'), 'tradeoffSpotlight should render and be non-empty');
assert(feedbackHtml.includes('Top Analyst currently blocked because:'), 'Top Analyst lock line should render when topGateLockReason exists');

console.log('anti-cheese-learning-audit: PASS');
