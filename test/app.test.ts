import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.ts'

vi.mock('../src/lib/supabase.ts', () => ({
  supabase: {
    from: vi.fn()
  }
}))

import { supabase } from '../src/lib/supabase.ts'

describe('createApp', () => {
  beforeEach(() => {
    process.env.CORS_ORIGIN = 'http://localhost:3000'
    vi.mocked(supabase.from).mockReset()
  })

  it('reports server health', async () => {
    const response = await request(createApp()).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })

  it('allows the configured frontend origin', async () => {
    const response = await request(createApp())
      .options('/api/posts')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET')

    expect(response.status).toBe(204)
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000'
    )
  })

  it('mounts the posts router', async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null })
    const select = vi.fn().mockReturnValue({ order })
    vi.mocked(supabase.from).mockReturnValue({ select } as never)

    const response = await request(createApp()).get('/api/posts')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  it('mounts the appointments router with JSON parsing', async () => {
    const response = await request(createApp())
      .post('/api/appointments')
      .send({})

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'missing required fields' })
  })
})
