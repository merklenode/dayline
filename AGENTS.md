# Dayline Agent Automation Rules

These instructions apply only to this repository: `merklenode/dayline`.

## Default Branch Flow

- `main` is production.
- `dev` is the integration and preview branch.
- Do not implement feature work directly on `main`.
- Agents may automatically create, check out, pull, commit, and push the `dev` branch for normal development work.
- Create or update work on `dev`, then open a PR to `main` only after manual preview testing.
- Never push directly to `main` without explicit user approval.
- Never merge into `main` without explicit user approval.

## Automation And Authentication

- Moa commands, GitHub CLI commands, and normal git commands are pre-approved for repository workflow automation when they operate on `dev`, issues, PRs, CI checks, or previews.
- Do not stop to ask the user before running Moa, `gh`, or git commands that are part of the documented `dev` workflow.
- If Moa, `gh`, Vercel, or git authentication is already available in the environment, use it directly.
- Do not ask the user for credentials, tokens, or interactive login unless the command fails because authentication is missing or expired.
- If authentication is missing, expired, or blocked, report the exact blocker and the command that failed.
- Destructive git operations still require explicit user approval, including force push, branch deletion, hard reset, and deleting remote refs.
- Production actions still require explicit user approval, including production Vercel deploys, merging to `main`, and pushing directly to `main`.

## Required Automation Path

For non-trivial product or code changes, use this order:

1. Plan locally in `docs/`.
2. Consult Moa oracles when the change affects UX, architecture, testing, security, or deployment.
3. Create a GitHub issue from the approved plan.
4. Use Moa workflow execution for issue-based implementation when the repo is available to Moa.
5. Verify locally.
6. Commit and push to `dev`.
7. Deploy or confirm a Vercel preview for `dev`.
8. Manually test the preview.
9. Only then open or merge toward `main`.

## Moa Usage

Prefer Moa for GitHub-tracked work. Run these automatically when they are part of the approved `dev` workflow:

```bash
moa oracle consult product-designer,frontend-engineer,testing-engineer "<planning question>"
moa wf report-issue merklenode/dayline --instruction "<issue creation instruction>"
moa wf solve merklenode/dayline <issue-number> --base dev --gate --watch
moa wf review merklenode/dayline <pr-number> --watch
moa wf fix-ci merklenode/dayline <pr-number> --gate --watch
moa wf merge merklenode/dayline <pr-number> --watch
```

If Moa reports that `merklenode/dayline` is not on the workspace allowlist, stop the Moa workflow and report the blocker. Do not pretend Moa executed the work.

## GitHub CLI Usage

Use `gh` only when Moa cannot perform the GitHub action or when direct repository inspection is needed.
Run `gh` automatically for issue, PR, branch, and CI inspection when credentials are already available.

Useful commands:

```bash
gh issue create --repo merklenode/dayline --title "<title>" --body-file <file>
gh issue view <issue-number> --repo merklenode/dayline
gh pr create --repo merklenode/dayline --base main --head dev --draft --title "<title>" --body "<body>"
gh pr checks <pr-number> --repo merklenode/dayline
gh pr view <pr-number> --repo merklenode/dayline
```

Never use `gh` to bypass a failed Moa workflow silently. If fallback is used, say why.

## Vercel Usage

The repository is linked to Vercel through `.vercel/`.

Use preview deployment for `dev` validation:

```bash
vercel --yes
```

Use production deployment only after manual approval and merge readiness:

```bash
vercel deploy --prod
```

Do not deploy production directly from unreviewed feature work.

## Local Verification

Before pushing or asking for review, run:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

In this environment, `pnpm build` may need elevated execution because Next/Turbopack can require local process binding during CSS processing.

## Preview Verification

After deploying to Vercel preview:

- Open the preview URL.
- Confirm the page loads.
- Smoke-test the primary task flow.
- Check mobile and desktop layout if UI changed.
- Report the preview URL in the final handoff.

## Current Product Direction

The active product direction is:

- Keep Dayline simple like the previous simple deployment.
- Use one `Today Plan` screen.
- Allow pre-planning for Tomorrow or a custom future date from the task input.
- Keep upcoming planned work separate from today's task cards and past history.
- Group tasks under four sections:
  - Plan & Research
  - Execution Time
  - Learning Time
  - Wind Up & Plan
- Manage section names and timer defaults behind a settings icon.
- Use a manual per-task timer.
- Do not auto-start from wall-clock time.
- Avoid returning to the large scheduled block UI unless explicitly requested.

See:

```text
docs/recent-implementation/README.md
docs/README.md
```
