import { escapeHtml, renderEmailShell, row } from './shared.ts'

export interface BookingNotificationInput {
  clientName: string
  clientEmail: string
  service: string
  dateLabel: string
  timeLabel: string
  contactPlatform: string
  contactDetail: string
  notes: string
}

/** Internal owner-facing notice for a new booking — always rendered in zh. */
export function renderBookingNotificationEmail(input: BookingNotificationInput): {
  subject: string
  html: string
} {
  const subject = `新預約通知：${input.clientName} - ${input.service}`

  const rows = [
    row('姓名', escapeHtml(input.clientName)),
    row('Email', escapeHtml(input.clientEmail)),
    row('服務項目', escapeHtml(input.service)),
    row('預約日期', escapeHtml(input.dateLabel)),
    row('預約時段', escapeHtml(input.timeLabel)),
    row('聯絡方式', `${escapeHtml(input.contactPlatform)} · ${escapeHtml(input.contactDetail)}`),
  ]
  if (input.notes.trim()) {
    rows.push(row('備註', escapeHtml(input.notes)))
  }

  const bodyHtml = `
    <h1 style="margin:0 0 18px;font-size:22px;font-weight:800;color:#023047;">新預約通知</h1>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#475569;">收到一筆新預約，詳情如下：</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows.join('')}
    </table>`

  const html = renderEmailShell({
    lang: 'zh',
    subject,
    preheader: `${input.clientName} 預約了「${input.service}」`,
    bodyHtml,
  })

  return { subject, html }
}
