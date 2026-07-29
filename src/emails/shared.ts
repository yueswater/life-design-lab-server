import { LOGO_BASE64_PNG } from './logo-base64.ts'

export const NAVY = '#023047'

export const BRAND = { zh: '生命設計實驗室', en: 'Life Design Lab' } as const
export const CONTACT_CTA = { zh: '聯絡我們', en: 'Contact Us' } as const

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#64748b;width:96px;vertical-align:top;">${label}</td>
      <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:600;color:${NAVY};">${value}</td>
    </tr>`
}

interface EmailShellInput {
  lang: 'zh' | 'en'
  subject: string
  preheader: string
  /** Pre-rendered inner HTML for the body cell (heading, intro, rows, etc.) */
  bodyHtml: string
}

/**
 * Shared header/body/footer chrome for every booking-related email — flat
 * white, brand mark + name, then whatever body content the caller renders,
 * then a copyright + contact-us footer row. Keeping this in one place means
 * every email variant stays visually identical without copy-pasting the
 * whole HTML document three times.
 */
export function renderEmailShell({ lang, subject, preheader, bodyHtml }: EmailShellInput): string {
  const brand = BRAND[lang]
  const contactCta = CONTACT_CTA[lang]

  return `<!doctype html>
<html lang="${lang === 'zh' ? 'zh-Hant' : 'en'}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${escapeHtml(preheader)}
    </span>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
            <!-- Header: brand bar with logo -->
            <tr>
              <td style="background-color:#ffffff;padding:28px 32px;text-align:center;">
                <img src="cid:logo" width="48" height="48" alt="${brand}" style="display:block;margin:0 auto 10px;" />
                <span style="font-size:15px;font-weight:800;color:${NAVY};letter-spacing:0.02em;">${brand}</span>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="background-color:#ffffff;padding:32px;">
                ${bodyHtml}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#ffffff;padding:0 32px 32px;">
                <div style="height:1px;background-color:#e2e8f0;margin-bottom:24px;"></div>
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
                  <tr>
                    <td style="font-size:12px;font-weight:700;color:${NAVY};vertical-align:middle;">
                      <a
                        href="https://life-design-lab.space"
                        style="color:${NAVY};text-decoration:none;"
                        >&copy; ${new Date().getFullYear()} ${brand}</a
                      >
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <a
                        href="mailto:support@life-design-lab.space"
                        style="color:${NAVY};font-size:12px;font-weight:700;text-decoration:none;"
                        >${contactCta}</a
                      >
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export { LOGO_BASE64_PNG }
