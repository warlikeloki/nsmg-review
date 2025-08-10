# Contributing to NSMG

Thanks for helping improve the site! This guide keeps contributions smooth and consistent.

## Quick Start (Checklist)

- [ ] Fork or create a feature branch off the private repo’s default branch.
- [ ] Follow the branch naming and commit style below.
- [ ] Make focused changes (one concern per PR).
- [ ] Run checks locally (lint/format/build if configured).
- [ ] Open a Pull Request using the template and link a Jira issue (e.g., NSMG-123).

## Branching & Naming

Create branches off `main` (or your integration branch):

```
git checkout main
git pull
git checkout -b feat/short-description
```

**Prefixes** (use lowercase, hyphenated description):

- `feat/` – new features
- `fix/` – bug fixes
- `docs/` – documentation changes
- `style/` – formatting only (no code change)
- `refactor/` – code changes that neither fix a bug nor add a feature
- `perf/` – performance improvements
- `test/` – add or improve tests
- `chore/` – tooling, build, or repo chores
- `ci/` – workflows and pipelines

## Commit Message Style (Conventional Commits)

Format: `type(scope): short summary`

Examples:
```
feat(home): add services accordion keyboard support
fix(admin): sanitize POST payloads in testimonials endpoint
docs(readme): add local dev instructions
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

## Local Development

> These commands are shown for **PowerShell**.

- Clone and install (if Node tooling is used):
  ```powershell
  git clone <your-private-repo-url>
  cd <repo>
  npm install
  ```

- Start a simple PHP dev server (if needed for `/admin/*.php`):
  ```powershell
  php -S localhost:8080 -t .
  ```

- Optional lint scripts (add later if not present yet):
  ```powershell
  npm run lint:html
  npm run lint:css
  npm run lint:js
  ```

## Pull Requests

- Keep PRs **small and focused**; one logical change per PR.
- Link the Jira issue in the PR description (e.g., `Relates to NSMG-123`).
- Ensure the PR checks all boxes in the PR template (tests, screenshots for UI, etc.).
- Expect reviewer feedback; respond and push updates to the same branch.

## Code Style

- HTML: semantic landmarks, a11y-first attributes, one `<h1>` per page.
- CSS: BEM-ish class names, no `!important`, prefer variables and utility classes.
- JS: modules, no global side effects, defensive DOM queries, sanitize HTML.
- PHP: prepared statements only, escape output, return correct HTTP codes.

## Security & Privacy

- Do **not** commit secrets or API tokens.
- Sanitize all input; escape all output.
- Admin endpoints must validate sessions and use CSRF for state-changing requests.

## Issue Labels (suggested)

- `type:bug`, `type:feature`, `type:docs`
- `area:frontend`, `area:backend`, `area:admin`, `area:build`
- `priority:low|med|high`

## Releasing

- Ensure sitemap/robots are correct for the environment.
- Bump changelog (if present) and verify Lighthouse scores on key pages.
- Confirm error logs are clean after deploy.