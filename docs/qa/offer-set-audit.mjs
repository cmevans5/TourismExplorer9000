import fs from 'fs';
import vm from 'vm';

function loadBrowserScript(path, context) {
  const code = fs.readFileSync(path, 'utf8');
  vm.runInContext(code, context, { filename: path });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

const { SCORING_CONSTANTS } = context.window.TE9000Scoring;
const { RUN_CONFIG, generateOfferSet, createRunRng } = context.window.TE9000Adaptation;
const missions = JSON.parse(fs.readFileSync('data/missions.json', 'utf8')).missions;

function roleCounts(rolesById, ids) {
  return ids.reduce((acc, id) => {
    const role = rolesById[id];
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
}

function checkOffer(state, seed) {
  const offer = generateOfferSet(missions, state, SCORING_CONSTANTS, RUN_CONFIG, createRunRng(seed));
  const ids = offer.offerMissionIds;
  assert(ids.length === 4, `Offer size must be 4, got ${ids.length}`);
  const counts = roleCounts(offer.rolesById, ids);
  assert((counts.recommended || 0) === 2, 'Offer must include 2 recommended');
  assert((counts.challenge || 0) === 1, 'Offer must include 1 challenge');
  assert((counts.wildcard || 0) === 1, 'Offer must include 1 wildcard');
  ids.forEach(id => assert(!state.completedMissionIds.includes(id), `Completed mission re-offered: ${id}`));

  const hubs = ids.map(id => missions.find(m => m.id === id)?.hub);
  const hubCounts = hubs.reduce((acc, hub) => {
    acc[hub] = (acc[hub] || 0) + 1;
    return acc;
  }, {});
  Object.values(hubCounts).forEach(count => assert(count < 3, 'Offer has 3 missions from same hub'));

  return offer;
}

const baseState = {
  categories: { economic: 2, sustainability: -1, culture: 0, hospitality: 1, satisfaction: 0 },
  completedMissionIds: [],
  lastChosenHub: 'Riverwalk',
  lastChosenIssueType: 'Mobility',
  decisionCount: 3,
  impactPointsSpent: 120,
  BII: 58,
  runSeed: 12345,
  casesCompletedThisRun: 2
};

const offerA = checkOffer(baseState, '12345:2');
const offerARepeat = checkOffer(baseState, '12345:2');
assert(JSON.stringify(offerA.offerMissionIds) === JSON.stringify(offerARepeat.offerMissionIds), 'Same seed/state should be deterministic');

const offerB = checkOffer(baseState, '99999:2');
assert(JSON.stringify(offerA.offerMissionIds) !== JSON.stringify(offerB.offerMissionIds), 'Different seeds should vary offers');

const progressedState = {
  ...baseState,
  completedMissionIds: [offerA.offerMissionIds[0], offerA.offerMissionIds[1]],
  casesCompletedThisRun: 4,
  categories: { economic: 4, sustainability: -2, culture: -1, hospitality: 2, satisfaction: 1 }
};
checkOffer(progressedState, '12345:4');

console.log('offer-set-audit: PASS');
