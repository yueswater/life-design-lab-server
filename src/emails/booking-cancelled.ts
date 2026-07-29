import { escapeHtml, renderEmailShell, row } from './shared.ts'

export interface BookingCancelledInput {
  lang: 'zh' | 'en'
  name: string
  service: string
  dateLabel: string
  timeLabel: string
  reason: string
}

const COPY = {
  zh: {
    subjectPrefix: '預約已取消',
    preheader: (service: string) => `很抱歉，您的「${service}」預約已取消。`,
    heading: '預約已取消',
    greeting: (name: string) => `${name} 您好，`,
    intro: '很抱歉，以下這場預約已經取消，造成不便敬請見諒。',
    service: '預約項目',
    date: '預約日期',
    time: '預約時段',
    reason: '取消原因',
    footerNote: '如有任何疑問，或想重新安排時間，歡迎直接回覆本信或透過下方聯絡方式與我們聯繫。',
  },
  en: {
    subjectPrefix: 'Booking Cancelled',
    preheader: (service: string) => `We're sorry — your "${service}" booking has been cancelled.`,
    heading: 'Booking Cancelled',
    greeting: (name: string) => `Hi ${name},`,
    intro: "We're sorry to let you know the session below has been cancelled. We apologize for the inconvenience.",
    service: 'Service',
    date: 'Date',
    time: 'Time',
    reason: 'Reason',
    footerNote:
      'If you have any questions or would like to rebook, just reply to this email or reach us using the contact below.',
  },
} as const

export function renderBookingCancelledEmail(input: BookingCancelledInput): {
  subject: string
  html: string
} {
  const c = COPY[input.lang]
  const subject = `${c.subjectPrefix}：${input.service}`

  const rows = [
    row(c.service, escapeHtml(input.service)),
    row(c.date, escapeHtml(input.dateLabel)),
    row(c.time, escapeHtml(input.timeLabel)),
    row(c.reason, escapeHtml(input.reason)),
  ]

  const bodyHtml = `
    <h1 style="margin:0 0 18px;font-size:22px;font-weight:800;color:#023047;">${c.heading}</h1>
    <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#023047;">${escapeHtml(c.greeting(input.name))}</p>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#475569;">${c.intro}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows.join('')}
    </table>
    <p style="margin:10px 0 0;font-size:12px;line-height:1.7;color:#94a3b8;">${c.footerNote}</p>`

  const html = renderEmailShell({
    lang: input.lang,
    subject,
    preheader: c.preheader(input.service),
    bodyHtml,
  })

  return { subject, html }
}
