import { createHmac, timingSafeEqual } from 'node:crypto'

function sign(secret: string, expiresAt: number): string {
  return createHmac('sha256', secret).update(`admin:${expiresAt}`).digest('hex')
}

/** Signs a stateless admin session token good until `expiresAt` (epoch ms). */
export function signAdminSession(secret: string, expiresAt: number): string {
  return `${expiresAt}.${sign(secret, expiresAt)}`
}

/** Verifies an admin session token: well-formed, correctly signed, not expired. */
export function verifyAdminSession(secret: string, token: string): boolean {
  const separatorIndex = token.indexOf('.')
  if (separatorIndex === -1) return false

  const expiresAtRaw = token.slice(0, separatorIndex)
  const signature = token.slice(separatorIndex + 1)
  const expiresAt = Number(expiresAtRaw)
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false

  const expected = sign(secret, expiresAt)
  const expectedBuffer = Buffer.from(expected, 'hex')
  const actualBuffer = Buffer.from(signature, 'hex')
  if (expectedBuffer.length !== actualBuffer.length) return false
  return timingSafeEqual(expectedBuffer, actualBuffer)
}
