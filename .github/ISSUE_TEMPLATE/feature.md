---
name: "Feature / Enhancement"
about: "Request or specify a new capability or improvement, aligned to Jira fields."
title: "NSM-XXX: <short, outcome-focused title>"
labels: ["enhancement", "triage"]
assignees: ""
---

# Title
NSM-XXX: <short feature/enhancement title>

## Summary
<1–3 sentences: the outcome and who benefits.>

## Description
**Context / Background**  
- <Why now; business/user value.>

**Problem / Goal**  
- <What we aim to achieve (not implementation).>

**Scope**
- In scope: <bullets>
- Out of scope (non-goals): <bullets>

**Success Metrics / KPIs (optional)**
- <e.g., reduce bounce on mobile nav by X%; improve CLS to <0.1>

## Acceptance Criteria
- [ ] <AC #1 — observable, testable>
- [ ] <AC #2 — Given/When/Then helpful here>
- [ ] <AC #3>
- [ ] Documentation updated (README/dev notes where applicable)

> **Gherkin example:**  
> **Given** <state>, **When** <action>, **Then** <expected outcome>.

## UX / Design
- Mockups / prototypes: <links or attach images>
- Content/copy: <notes or link to doc>

## Technical Notes
- Approach / architecture: <brief plan or options>
- Affected areas: <files, routes, components>
- API / Data (if any): <endpoints, payloads>
- Telemetry: <events to track>

## Risks & Mitigations
- Risks: <e.g., regression risk in header>
- Mitigations/Rollback: <flag/kill-switch, revert steps>

## Dependencies / Blockers
- <e.g., asset delivery, API readiness, upstream library>

## Rollout
- Feature flag: <yes/no; flag name>
- Migration/backfill (if any): <notes>

## Definition of Done
- [ ] All Acceptance Criteria pass
- [ ] Cross-device test (iOS Safari + Android Chrome + desktop)
- [ ] No new console errors / performance regressions
- [ ] CI/CD green; code reviewed/approved
- [ ] Docs updated

## Priority (1–7)
<Choose 1–7 where 1 = highest/urgent, 7 = lowest>

## Estimate
<e.g., 1–2d, 5pts>

## Owner(s)
- Assignee: <name>
- Reviewers: <names>

## Links
- Related Jira/PRs/threads: <IDs/URLs>
- References: <benchmark sites, specs>
