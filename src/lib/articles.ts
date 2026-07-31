import { createHash } from 'node:crypto'

export const ARTICLE_STATUSES = ['draft', 'published', 'archived'] as const
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number]

export function isArticleStatus(value: unknown): value is ArticleStatus {
  return typeof value === 'string' && (ARTICLE_STATUSES as readonly string[]).includes(value)
}

/** Turns a title into a URL-safe slug, keeping CJK characters as-is. */
export function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'article'
}

/** Hashes a client IP so we can dedupe view counts without storing raw IPs. */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? 'life-design-lab'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

export function clientIp(request: { headers: Record<string, unknown>; socket: { remoteAddress?: string } }): string {
  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }
  return request.socket.remoteAddress ?? 'unknown'
}
