---
name: "Bug"
about: "Report a defect with clear repro, environment, and acceptance criteria."
title: "NSM-XXX: <short, action-oriented bug title>"
labels: ["bug", "triage"]
assignees: ""
---

# Title
NSM-XXX: <short bug title>

## Summary
<1–3 sentences: what’s broken, where, who it affects.>

## Description
**Context / Background**  
- <Why this matters; business/user impact.>

**Problem**  
- <What is happening that should not.>

**Scope**
- In scope: <bullets>
- Out of scope: <bullets>

## Reproduction Steps
1. Go to <URL/path>
2. On <device/browser/viewport>
3. Do <action/sequence>
4. Observe <actual result>

**Actual vs Expected**
- Actual: <what happened>
- Expected: <what should happen>

## Environment
- Affected pages/paths: </path, URL>
- Devices/Browsers: <iOS Safari 17, Android Chrome 126, Desktop Chrome 127…>
- Viewports: <e.g., 360×800, 390×844, desktop>
- Release/Commit: <tag or short SHA>
- Logs/Console: <attach snippets>

## Acceptance Criteria
- [ ] <AC #1 — observable, testable>
- [ ] <AC #2 — Given/When/Then helpful here>
- [ ] <AC #3>
- [ ] Documentation updated (README/dev notes if applicable)

> **Gherkin example:**  
> **Given** <state>, **When** <action>, **Then** <expected outcome>.

## Risks & Mitigations
- Risks: <e.g., could affect desktop nav>
- Mitigations/Rollback: <how to revert; flags; quick rollback plan>

## Definition of Done
- [ ] All Acceptance Criteria pass
- [ ] Cross-device test (iOS Safari + Android Chrome + desktop)
- [ ] No new console errors / performance regressions
- [ ] CI/CD green; changes reviewed/approved
- [ ] Docs updated

## Priority (1–7)
<Choose 1–7 where 1 = highest/urgent, 7 = lowest>

## Estimate
<e.g., 2–4h, 1d
