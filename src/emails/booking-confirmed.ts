import { escapeHtml, renderEmailShell, row } from './shared.ts'

export interface BookingConfirmedInput {
  lang: 'zh' | 'en'
  name: string
  service: string
  dateLabel: string
  timeLabel: string
}

const COPY = {
  zh: {
    subjectPrefix: '預約已確認',
    preheader: (service: string, dateLabel: string) => `您的「${service}」已確認，時間是 ${dateLabel}。`,
    heading: '您的預約已確認！',
    greeting: (name: string) => `${name} 您好，`,
    intro: '提醒您，以下這場已經確認囉，請提前安排好時間，到時見！',
    service: '預約項目',
    date: '預約日期',
    time: '預約時段',
    footerNote: '如需變更，請直接回覆本信或透過下方聯絡方式與我們聯繫。',
  },
  en: {
    subjectPrefix: 'Booking Confirmed',
    preheader: (service: string, dateLabel: string) => `Your "${service}" is confirmed for ${dateLabel}.`,
    heading: 'Your Booking Is Confirmed!',
    greeting: (name: string) => `Hi ${name},`,
    intro: "Just a reminder — this session is now confirmed. Please make time for it, and we'll see you then!",
    service: 'Service',
    date: 'Date',
    time: 'Time',
    footerNote: 'Need to change anything? Just reply to this email or reach us using the contact below.',
  },
} as const

export function renderBookingConfirmedEmail(input: BookingConfirmedInput): {
  subject: string
  html: string
} {
  const c = COPY[input.lang]
  const subject = `${c.subjectPrefix}：${input.service}｜${input.dateLabel}`

  const rows = [
    row(c.service, escapeHtml(input.service)),
    row(c.date, escapeHtml(input.dateLabel)),
    row(c.time, escapeHtml(input.timeLabel)),
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
    preheader: c.preheader(input.service, input.dateLabel),
    bodyHtml,
  })

  return { subject, html }
}
