import { Resend } from 'resend'

// Falls back to a placeholder so importing this module never throws (e.g. in
// tests, or a dev environment without email configured yet) — sending will
// simply fail at call time if the key was never really set.
export const resend = new Resend(process.env.RESEND_API_KEY || 're_unconfigured')
export const RESEND_FROM = process.env.RESEND_FROM ?? 'Life Design Lab <contact@life-design-lab.space>'
