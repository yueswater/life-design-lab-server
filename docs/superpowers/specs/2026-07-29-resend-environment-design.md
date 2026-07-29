# Resend Environment Configuration

## Scope

Configure the server to make the same Resend sending credential and default
sender available in local, PRD, and UAT environments. This change does not yet
send email from the appointment route.

## Configuration

- Add `RESEND_API_KEY` to `.env`, `.env.prd`, and `.env.uat` using the same
  user-provided key.
- Add `RESEND_FROM` to those files with
  `Life Design Lab <contact@life-design-lab.space>`.
- Add empty `RESEND_API_KEY` and the non-secret default `RESEND_FROM` to
  `.env.example`.
- Keep all populated environment files ignored by Git.

## Verification

- Confirm all three populated environment files expose both variable names
  without printing their values.
- Confirm `.env`, `.env.prd`, and `.env.uat` remain ignored and untracked.
- Confirm `.env.example` contains no API key.
- Do not send another test email; the user has already confirmed successful
  delivery to both requested recipients.

## Deferred Work

Connecting Resend to successful appointment creation, choosing email content,
and defining failure behavior are separate product decisions.
