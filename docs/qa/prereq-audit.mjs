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

const stateMinDecisionGate = {
  categories: { economic: 0, sustainability: 0, culture: 0, hospitality: 0, satisfaction: 0 },
  completedMissionIds: [],
  lastChosenHub: null,
  lastChosenIssueType: null,
  decisionCount: 0,
  impactPointsSpent: 0,
  BII: 50,
  runSeed: 4242,
  casesCompletedThisRun: 0
};

const minDecisionEligible = missions.filter(mission => {
  const prereq = mission.prerequisites || {};
  const minDecisions = Number(prereq.minDecisions);
  return !Number.isFinite(minDecisions) || minDecisions === 0;
});

const offerAtZero = generateOfferSet(
  missions,
  stateMinDecisionGate,
  SCORING_CONSTANTS,
  RUN_CONFIG,
  createRunRng('prereq:min-decisions')
);

if (minDecisionEligible.length >= 4) {
  offerAtZero.offerMissionIds.forEach(id => {
    const mission = missions.find(item => item.id === id);
    const minDecisions = Number(mission?.prerequisites?.minDecisions);
    assert(!Number.isFinite(minDecisions) || minDecisions < 1, `Mission gated by minDecisions appeared too early: ${id}`);
  });
}

const stateRequiresFlagGate = {
  categories: { economic: 1, sustainability: 1, culture: 1, hospitality: 1, satisfaction: 1 },
  completedMissionIds: [],
  lastChosenHub: null,
  lastChosenIssueType: null,
  decisionCount: 5,
  impactPointsSpent: 120,
  BII: 60,
  runSeed: 5252,
  casesCompletedThisRun: 3
};

const requiresFlagEligible = missions.filter(mission => {
  const requiredMission = mission?.prerequisites?.requiresFlag;
  return !requiredMission || stateRequiresFlagGate.completedMissionIds.includes(requiredMission);
});

const offerWithoutFlag = generateOfferSet(
  missions,
  stateRequiresFlagGate,
  SCORING_CONSTANTS,
  RUN_CONFIG,
  createRunRng('prereq:requires-flag')
);

if (requiresFlagEligible.length >= 4) {
  offerWithoutFlag.offerMissionIds.forEach(id => {
    const mission = missions.find(item => item.id === id);
    assert(!mission?.prerequisites?.requiresFlag, `Mission gated by requiresFlag appeared before requirement completion: ${id}`);
  });
}

console.log('prereq-audit: PASS');
