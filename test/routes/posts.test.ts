import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { postsRouter } from '../../src/routes/posts.ts'

vi.mock('../../src/lib/supabase.ts', () => ({
  supabase: {
    from: vi.fn()
  }
}))

import { supabase } from '../../src/lib/supabase.ts'

function buildApp() {
  const app = express()
  app.use('/api/posts', postsRouter)
  return app
}

describe('GET /api/posts', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset()
  })

  it('returns posts ordered by created_at descending', async () => {
    const posts = [
      {
        id: 1,
        title: 'Hello',
        content: 'World',
        created_at: '2026-01-01'
      }
    ]
    const order = vi.fn().mockResolvedValue({ data: posts, error: null })
    const select = vi.fn().mockReturnValue({ order })
    vi.mocked(supabase.from).mockReturnValue({ select } as never)

    const response = await request(buildApp()).get('/api/posts')

    expect(response.status).toBe(200)
    expect(response.body).toEqual(posts)
    expect(supabase.from).toHaveBeenCalledWith('posts')
    expect(select).toHaveBeenCalledWith('*')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('returns the database error when loading posts fails', async () => {
    const order = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'boom' }
    })
    const select = vi.fn().mockReturnValue({ order })
    vi.mocked(supabase.from).mockReturnValue({ select } as never)

    const response = await request(buildApp()).get('/api/posts')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ error: 'boom' })
  })
})
