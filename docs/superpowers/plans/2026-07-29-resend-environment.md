# Resend Environment Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make one Resend sending credential and the approved default sender available to local, PRD, and UAT server environments without committing secrets.

**Architecture:** Store populated values only in Git-ignored environment files. Keep the tracked example file useful for setup while leaving the API key empty.

**Tech Stack:** dotenv environment files, Git ignore rules, shell verification

## Global Constraints

- Use the same user-provided Resend API key in `.env`, `.env.prd`, and `.env.uat`.
- Use `Life Design Lab <contact@life-design-lab.space>` as `RESEND_FROM`.
- Never add the populated API key to a tracked file or command output.
- Do not connect Resend to the appointment route in this task.

---

### Task 1: Configure Resend environment variables

**Files:**
- Modify: `.env`
- Modify: `.env.prd`
- Modify: `.env.uat`
- Modify: `.env.example`

**Interfaces:**
- Consumes: the user-provided Resend API key
- Produces: `process.env.RESEND_API_KEY` and `process.env.RESEND_FROM` for future server email code

- [x] **Step 1: Add populated configuration to ignored environments**

Append these variable names to `.env`, `.env.prd`, and `.env.uat`, using the
user-provided key as the first value:

```dotenv
RESEND_API_KEY=<user-provided-key>
RESEND_FROM=Life Design Lab <contact@life-design-lab.space>
```

- [x] **Step 2: Add safe configuration documentation**

Append the following to `.env.example`:

```dotenv
RESEND_API_KEY=
RESEND_FROM=Life Design Lab <contact@life-design-lab.space>
```

- [x] **Step 3: Verify populated files remain ignored and untracked**

Run:

```bash
git check-ignore -v .env .env.prd .env.uat
test -z "$(git ls-files -- .env .env.prd .env.uat)"
```

Expected: all three files match `.env*`, and `git ls-files` emits no paths.

- [x] **Step 4: Verify all environments define both names without exposing values**

Run a value-redacting check over `.env`, `.env.prd`, `.env.uat`, and
`.env.example`.

Expected: each file contains exactly one `RESEND_API_KEY` and one
`RESEND_FROM`; `.env.example` has a blank API key.

- [x] **Step 5: Verify tracked changes contain no Resend secret**

Run:

```bash
git diff --check
git diff -- .env.example
git status --short
```

Expected: `.env.example` shows only the blank API-key variable and approved
default sender; populated environment files do not appear in Git status.

- [x] **Step 6: Commit only the tracked example and plan**

```bash
git add .env.example docs/superpowers/plans/2026-07-29-resend-environment.md
git commit -m "chore: document Resend environment"
```
