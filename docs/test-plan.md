# Tourism Explorer 9000 — Anti-Cheese + Learning Impact QA Plan

## Scope
Validate adaptive per-step offer generation, anti-cheese protections, deterministic seeded behavior, and learning-impact feedback completeness.

## Manual + automated checklist

### TC-01: Run length end condition
**Check**: completing exactly 8 cases routes immediately to Game Complete.

### TC-02: Offer set size and composition
**Check**: every map render shows exactly 4 cards and role labels count as 2 Recommended, 1 Challenge, 1 Wildcard.

### TC-03: Offer set refresh cadence
**Check**: after each completed case + Return to Map, a new 4-mission offer set is generated.

### TC-04: No repeats of completed missions
**Check**: any mission in `completedMissionIds` is never offered again in the same run.

### TC-05: Determinism within fixed seed
**Check**: same `runSeed` and same sequence of decisions reproduces the same per-step offers and card order.

### TC-06: Variation across new runs
**Check**: Start New Run produces a different `runSeed` and typically different step-1 offer order.

### TC-07: Offer card order shuffles by step
**Check**: step N and step N+1 reorder displayed cards when possible, while preserving each card's role/reason.

### TC-08: Hub variety constraint
**Check**: no single offer set contains 3 missions from the same hub (when alternatives exist).

### TC-09: Last-hub repetition avoidance
**Check**: generator avoids re-offering the same hub as `lastChosenHub` where viable.

### TC-10: issueType variety constraint
**Check**: offer set maintains issueType diversity and avoids over-concentration when alternatives exist.

### TC-11: Decision label leak prevention
**Check**: Decision options display as `A)`, `B)`, `C)` exactly once each, with no leaked original option key prefixes like `A) C)`.

### TC-12: “Always click B” anti-cheese attempt
**Check**: repeatedly click presentation label `B` for 3+ cases; verify outcomes vary with shuffled underlying options.

### TC-13: Pattern-gaming nudge trigger
**Check**: after repeatedly selecting one presentation label across cases, Map shows one Pip nudge: “Options are shuffled each case—choose based on trade-offs, not the letter.”

### TC-14: Pattern-gaming nudge shown once per run
**Check**: after first appearance in a run, the nudge does not repeatedly reappear on later map visits in the same run.

### TC-15: Outcome feedback learning note
**Check**: any selected option shows non-empty `learningNote`.

### TC-16: Outcome feedback system insight
**Check**: any selected option shows non-empty `systemInsight` sentence.

### TC-17: Outcome feedback trade-off spotlight
**Check**: any selected option shows one-sentence `Trade-off Spotlight` naming biggest positive/negative categories when applicable.

### TC-18: Top Analyst lock counterfactual line
**Check**: when `topGateLockReason` exists, Outcome Feedback includes one line: `Top Analyst currently blocked because: ...`.

### TC-19: Pip “why these cases” alignment
**Check**: Pip summary references current lowest category/variance/flags and per-mission reasons from the current offer set.

### TC-20: Pip remediation after two poor outcomes
**Check**: forced Pip state suggests 2 stabilizing missions and “Highlight these on map” emphasizes them without auto-routing.

## Automated QA scripts

Run:

```bash
node docs/qa/offer-set-audit.mjs
node docs/qa/anti-cheese-learning-audit.mjs
```

The anti-cheese + learning audit verifies:
- offer set size is always 4
- role composition is exactly 2/1/1
- completed missions are excluded
- deterministic same-seed offer order per step
- order varies by step when possible
- decision rendering does not leak original option keys
- `learningNote`, `systemInsight`, and `tradeoffSpotlight` render as non-empty strings
