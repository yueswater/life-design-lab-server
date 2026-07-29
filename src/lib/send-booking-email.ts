import { resend, RESEND_FROM } from './resend.ts'
import { LOGO_BASE64_PNG } from '../emails/shared.ts'

interface SendBookingEmailInput {
  to: string
  subject: string
  html: string
}

/** Sends a booking-related email with the brand logo inlined as a `cid:logo` attachment. */
export async function sendBookingEmail({ to, subject, html }: SendBookingEmailInput): Promise<void> {
  await resend.emails.send({
    from: RESEND_FROM,
    to,
    subject,
    html,
    attachments: [
      {
        filename: 'logo.png',
        content: LOGO_BASE64_PNG,
        contentType: 'image/png',
        contentId: 'logo'
      }
    ]
  })
}
