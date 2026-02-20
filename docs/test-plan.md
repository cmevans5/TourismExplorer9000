# Tourism Explorer 9000 — Tourism Sampling QA Plan

## Scope
Validate adaptive Tourism Sampling, seeded controlled randomness, and Pip remediation/coaching behavior.

## Manual + automated checklist

### TC-01: Run length end condition
**Check**: completing exactly 8 cases routes immediately to Game Complete.

### TC-02: Sample set size
**Check**: `sampledMissionIds.length === 8` for each run.

### TC-03: Run persistence
**Check**: refresh keeps the same `runId`, `runSeed`, and sampled mission list until Start New Run.

### TC-04: Start New Run reset
**Check**: Start New Run resets `casesCompletedThisRun`, `completedMissionIds`, and creates a fresh sampled set.

### TC-05: Map shows sampled-only missions
**Check**: Map renders only missions in `sampledMissionIds` and hides non-sampled missions.

### TC-06: Sampling variety guard (hub)
**Check**: sampled sequence has no 3 adjacent missions from the same hub.

### TC-07: Sampling variety guard (issue tag)
**Check**: back-to-back identical issueType is avoided when alternatives are available.

### TC-08: Pip “why these cases” explanation
**Check**: Ask Pip button opens panel with weakest category mention and Tourism Sampling principle.

### TC-09: Variance-aware Pip explanation
**Check**: if variance is above threshold, Pip explicitly references spread/imbalance.

### TC-10: “Why am I seeing this?” toggle accessibility
**Check**: toggle is collapsed by default, keyboard-focusable, announces `aria-expanded`, and can be opened/closed by keyboard.

### TC-11: Pip remediation source constraint
**Check**: remediation mission IDs are selected from current sampled missions.

### TC-12: Pip “Take me there” routing
**Check**: button routes directly to top remediation mission in current sample.

### TC-13: Forced Pip trigger retained
**Check**: two consecutive poor outcomes still force Pip coaching flow.

### TC-14: Proactive Pip indicator
**Check**: when Top Analyst is gated and at least 2 cases are completed, map shows a subtle Pip update indicator.

### TC-15: Determinism within run / variation across runs
**Check**: for fixed seed, sampled output is deterministic; different seeds produce different sampled sets.

### TC-16: Vertical scroll behavior on Map
**Check**: with 6+ mission cards visible, the page scrolls vertically on Map and no root layout container blocks scroll.

## Automated QA scripts

Run:

```bash
node docs/qa/tourism-sampling-audit.mjs
```

The script verifies:
- run sample length equals `RUN_LENGTH`
- hub variety constraints
- deterministic per seed
- variation across different seeds
- diagnosis contract includes a recommended focus and 1–2 remediation missions
