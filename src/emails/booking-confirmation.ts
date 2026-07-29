import { escapeHtml, renderEmailShell, row, BRAND } from './shared.ts'

export interface BookingConfirmationInput {
  lang: 'zh' | 'en'
  name: string
  service: string
  dateLabel: string
  timeLabel: string
  contactPlatform: string
  contactDetail: string
  notes: string
}

const COPY = {
  zh: {
    subjectPrefix: '預約成功',
    preheader: (service: string) => `我們已收到您對「${service}」的預約，將盡快與您確認細節。`,
    heading: '預約成功！',
    greeting: (name: string) => `${name} 您好，`,
    intro: '感謝您的預約，我們已收到以下資訊，將由專人透過您留下的聯絡方式與您確認時間細節。',
    service: '預約項目',
    date: '預約日期',
    time: '預約時段',
    contact: '聯絡方式',
    notes: '補充說明',
    footerNote: '如需變更或取消，請直接回覆本信或透過下方聯絡方式與我們聯繫。',
  },
  en: {
    subjectPrefix: 'Booking Confirmed',
    preheader: (service: string) =>
      `We've received your booking for "${service}" and will confirm the details with you soon.`,
    heading: 'Booking Confirmed!',
    greeting: (name: string) => `Hi ${name},`,
    intro:
      "Thank you for booking with us. We've received the details below, and someone will reach out through your preferred contact method to confirm the timing.",
    service: 'Service',
    date: 'Date',
    time: 'Time',
    contact: 'Contact',
    notes: 'Notes',
    footerNote: 'Need to change or cancel? Just reply to this email or reach us using the contact below.',
  },
} as const

export function renderBookingConfirmationEmail(input: BookingConfirmationInput): {
  subject: string
  html: string
} {
  const c = COPY[input.lang]
  const subject = `${c.subjectPrefix}：${input.service}`

  const rows = [
    row(c.service, escapeHtml(input.service)),
    row(c.date, escapeHtml(input.dateLabel)),
    row(c.time, escapeHtml(input.timeLabel)),
    row(c.contact, `${escapeHtml(input.contactPlatform)} · ${escapeHtml(input.contactDetail)}`),
  ]
  if (input.notes.trim()) {
    rows.push(row(c.notes, escapeHtml(input.notes)))
  }

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

export { BRAND }
