# Tourism Explorer 9000 — Vertical Slice Scope

## Development Plan (5–10 bullets)
1. Define the smallest playable loop: City Map → one hotspot → one decision → feedback → dashboard → return to map.
2. Lock a single hotspot scenario with placeholder exploration media and one decision node (A/B/C) impacting multiple categories.
3. Standardize Storyline variables and naming conventions so triggers and scoring remain consistent.
4. Implement a simple but rigorous balance-oriented scoring model (Balanced Impact Index, BII).
5. Add consequence logic, including negative token values and a poor-outcome streak counter.
6. Trigger Pip scaffolding after two consecutive poor outcomes.
7. Enable one replay of the hotspot for testing and learning reinforcement.
8. Document exact trigger sequencing per slide/layer for direct Storyline implementation.
9. Validate with a mini QA test plan focused on balance logic, thresholds, and Pip behavior.

## Vertical Slice Build Scope (Phase 1)

### 1) City Map Hub (single playable hotspot)
- Build one City Map slide with one interactive hotspot button (e.g., **Downtown Riverwalk District**).
- Include visual indicators for:
  - hotspot availability,
  - hotspot completion,
  - replay availability (one replay only).
- Include a Token Dashboard button to open current totals and BII.

### 2) Exploration Segment (short, placeholder-friendly)
- Build one exploration slide with:
  - short narrative brief (50–120 words),
  - one placeholder image/video block,
  - 2–3 data callouts (e.g., seasonal footfall, local business concerns, visitor sentiment).
- End exploration with a **Proceed to Decision** button.

### 3) Decision Point (A/B/C)
- Build one decision slide with three options:
  - **A: Event-heavy growth push**
  - **B: Green mobility + community co-design**
  - **C: Premium experience + dynamic pricing**
- Each option changes multiple token categories (positive and negative tradeoffs).
- Option selection immediately updates variables, computes poor/good outcome state, and routes to feedback.

### 4) Token Dashboard Layer/Slide
- Show current totals for all five categories:
  - Economic Capital
  - Sustainability
  - Cultural Inclusion
  - Hospitality
  - Visitor Satisfaction
- Show computed **Balanced Impact Index (BII)**.
- Show an optional rating band (e.g., At Risk / Developing / Proficient / Exemplary) based on thresholds.

### 5) Pip NPC Scaffolding Rule
- If learner records **2 consecutive poor outcomes**, show Pip hint layer/slide before returning to map.
- Pip provides strategy cues emphasizing balanced systems thinking.
- Pip should appear once per streak trigger event and reset when learner achieves a non-poor outcome.

### 6) Return-to-Map + Replay Once
- After feedback (and Pip check), learner returns to City Map.
- Allow one replay of the same hotspot for QA/testing:
  - first completion sets hotspot as completed,
  - replay remains enabled once,
  - second completion disables hotspot interaction.

## Out of Scope for Vertical Slice
- Multiple hotspots/branching map progression.
- Persistent LMS leaderboard integration (only local simulated leaderboard placeholder if desired).
- Complex inventory/resource economy beyond token tradeoff logic.
- Full narrative arc and polished media production assets.

## Acceptance Criteria
- Learner can complete one full loop end-to-end.
- Decision A/B/C updates at least two categories each.
- Dashboard displays category totals and BII correctly after decisions.
- Negative token totals are allowed.
- Pip appears after two consecutive poor outcomes.
- One replay is possible; further re-entry is blocked.
