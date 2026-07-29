import { timingSafeEqual } from 'node:crypto'
import type { Request } from 'express'
import { signAdminSession, verifyAdminSession } from './admin-session.ts'

export const ADMIN_SESSION_COOKIE = 'ldl_admin_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 12 // 12 hours

function sessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET must be set')
  return secret
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME ?? ''
  const expectedPassword = process.env.ADMIN_PASSWORD ?? ''
  return safeEqual(username, expectedUsername) && safeEqual(password, expectedPassword)
}

export function createAdminSessionCookie(): { token: string; maxAgeMs: number } {
  const maxAgeMs = SESSION_DURATION_SECONDS * 1000
  const expiresAt = Date.now() + maxAgeMs
  return { token: signAdminSession(sessionSecret(), expiresAt), maxAgeMs }
}

export function isAdminAuthenticated(request: Request): boolean {
  const token = request.cookies?.[ADMIN_SESSION_COOKIE]
  if (!token) return false
  return verifyAdminSession(sessionSecret(), token)
}
