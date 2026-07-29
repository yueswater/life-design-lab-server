export const TAIPEI_OFFSET = '+08:00'

export const slotFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Taipei',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})

export const dateFormatters = {
  zh: new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }),
  en: new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })
}

export function resolveLang(value: unknown): 'zh' | 'en' {
  return value === 'en' ? 'en' : 'zh'
}
