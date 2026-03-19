# Alpha Readiness Note

This note clarifies the current implementation direction for Tourism Explorer 9000 and resolves prior ambiguity between older planning language and the current repo.

## Platform Clarification

Tourism Explorer 9000 is a **browser-based HTML/CSS/JavaScript prototype** being built in the `cmevans5/TourismExplorer9000` repository.

It is **not currently a Storyline build**.

Older design language and course-facing drafts may still mention Storyline because earlier planning considered that pathway. For the purposes of the current repo, Codex-supported development, iteration, and alpha preparation, the project should be described as:

> A browser-based academic game prototype developed with web technologies and structured for HTML5 delivery.

## What Is Working Well

- The project has a clear instructional premise: the learner acts as a tourism analyst making trade-off decisions.
- The core loop is coherent: briefing, evidence review, decision, outcome, reflection.
- The prototype already supports a stronger academic identity than a simple branching quiz.
- The repo is moving toward a more testable case-based structure with reusable mission schema and scoring logic.

## Current Risks

The main risk is not concept failure. The main risk is **scope drift**.

The project can become too large if we try to perfect every system before alpha. The biggest pressure points are:

- too many systems being polished at once
- unclear or shifting scoring logic
- legacy language that makes the platform sound inconsistent
- the temptation to expand content before the core loop is stable

## Alpha Goal

Alpha should mean a **stable, playable vertical slice**, not a fully finished game.

For this project, alpha readiness should include:

- one complete playable start-to-finish loop
- a frozen scoring model that works consistently
- dashboard updates that are understandable to a tester
- a limited number of polished missions or cases
- one controlled coaching/intervention moment
- a final score and reflection screen

## Recommended Iteration Plan

### 1. Freeze the design spine
Lock these items before major expansion:

- platform language: browser-based HTML/CSS/JS prototype
- variable names and definitions
- scoring formula
- rule for when coaching/adaptation appears

### 2. Build the vertical slice first
Prioritize:

- intro
- one dashboard flow
- two to four playable cases already in the repo
- reliable state updates
- final score + reflection

### 3. Reduce cognitive load for alpha
Keep the interface readable and focused:

- highlight only the categories changed by each choice
- keep consequence text concise
- make score changes legible
- avoid too many simultaneous signals on screen

### 4. Test understanding, not just completion
Alpha testing should ask whether players:

- understand the goal
- understand the impact categories
- perceive trade-offs as meaningful
- can interpret feedback and score changes
- feel the system is fair and learnable

## Working Team Interpretation

When discussing the repo going forward, the safest shared understanding is:

- the project is **academically strong but still being production-tightened**
- the next iteration should focus on **stability, clarity, and scope control**
- alpha readiness depends more on **locking the core loop** than on adding more features

## Short Version

Tourism Explorer 9000 is in a good place conceptually, but the path to alpha is:

**clarify the platform, freeze the logic, tighten the loop, and test a smaller polished slice before expanding the game further.**
