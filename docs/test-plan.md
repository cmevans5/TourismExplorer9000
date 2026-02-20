# Tourism Explorer 9000 — Mission Pool QA Plan

## Scope
Validate the expanded adaptive mission database and ensure Top Analyst remains achievable but rare.

## Automated QA entrypoint
Run:

```bash
node docs/qa/mission-pool-audit.mjs
```

This script executes the structural and balancing assertions in TC-01 through TC-10.

## Test Cases

### TC-01: Mission pool size
**Check**: mission count is between 15 and 20.

### TC-02: Mission identity uniqueness
**Check**: every mission has a unique `id`.

### TC-03: Hub coverage distribution
**Check**: 6–8 hubs are present and each hub has 2–3 cases.

### TC-04: Required mission schema fields
**Check**: each mission includes `hub`, `issueType`, `pedagogy`, `exploration.bullets`, `mediaLabel`, and `options A/B/C`.

### TC-05: Option payload completeness
**Check**: every option includes `cost`, full `deltas` for all five categories, and `feedback`.

### TC-06: Adaptive remediation tagging
**Check**: at least one mission is tagged for remediation (`pedagogy.tags` includes `remediation`).

### TC-07: Consequence follow-up tagging
**Check**: at least one mission is tagged `consequence-followup` for same-hub progression hooks.

### TC-08: Variety guard support
**Check**: mission ordering does not contain the same hub three times in a row.

### TC-09: Achievable Top Analyst path over ~9 decisions
**Check**: brute-force on a 9-case sample confirms at least one path where all categories `>=2`, variance `<=2`, and top threshold is met.

### TC-10: Near-miss gating behavior
**Check**: at least one intentionally near-balanced 9-case route fails Top Analyst due to gate requirements.
