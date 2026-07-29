import { beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import { appointmentsRouter } from '../../src/routes/appointments.ts'

vi.mock('../../src/lib/supabase.ts', () => ({
  supabase: {
    from: vi.fn()
  }
}))

import { supabase } from '../../src/lib/supabase.ts'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/appointments', appointmentsRouter)
  return app
}

describe('GET /api/appointments', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset()
  })

  it('returns 400 when date is missing', async () => {
    const response = await request(buildApp()).get('/api/appointments')

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'date query param is required' })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('returns 400 when date is not a calendar date', async () => {
    const response = await request(buildApp()).get(
      '/api/appointments?date=2026-02-30'
    )

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: 'date query param must be YYYY-MM-DD'
    })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('returns booked Taipei time slots for the requested date', async () => {
    const neq = vi.fn().mockResolvedValue({
      data: [
        { appointment_date: '2026-08-01T01:00:00.000Z' },
        { appointment_date: '2026-08-01T06:30:00.000Z' }
      ],
      error: null
    })
    const lt = vi.fn().mockReturnValue({ neq })
    const gte = vi.fn().mockReturnValue({ lt })
    const select = vi.fn().mockReturnValue({ gte })
    vi.mocked(supabase.from).mockReturnValue({ select } as never)

    const response = await request(buildApp()).get(
      '/api/appointments?date=2026-08-01'
    )

    expect(response.status).toBe(200)
    expect(response.body).toEqual(['09:00', '14:30'])
    expect(supabase.from).toHaveBeenCalledWith('appointments')
    expect(select).toHaveBeenCalledWith('appointment_date')
    expect(gte).toHaveBeenCalledWith(
      'appointment_date',
      '2026-07-31T16:00:00.000Z'
    )
    expect(lt).toHaveBeenCalledWith(
      'appointment_date',
      '2026-08-01T16:00:00.000Z'
    )
    expect(neq).toHaveBeenCalledWith('status', 'cancelled')
  })

  it('returns the database error when loading slots fails', async () => {
    const neq = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'boom' }
    })
    const lt = vi.fn().mockReturnValue({ neq })
    const gte = vi.fn().mockReturnValue({ lt })
    const select = vi.fn().mockReturnValue({ gte })
    vi.mocked(supabase.from).mockReturnValue({ select } as never)

    const response = await request(buildApp()).get(
      '/api/appointments?date=2026-08-01'
    )

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ error: 'boom' })
  })
})

describe('POST /api/appointments', () => {
  const payload = {
    name: 'Jasmine',
    email: 'jasmine@example.com',
    contactPlatform: 'Line ID',
    contactDetail: 'jasmine_line',
    notes: 'wants career advice',
    appointmentDate: '2026-08-01',
    slot: '09:00'
  }

  beforeEach(() => {
    vi.mocked(supabase.from).mockReset()
  })

  it('returns 400 when a required field is blank', async () => {
    const response = await request(buildApp())
      .post('/api/appointments')
      .send({ ...payload, name: '   ' })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'missing required fields' })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('returns 400 when the slot is not offered by the booking form', async () => {
    const response = await request(buildApp())
      .post('/api/appointments')
      .send({ ...payload, slot: '09:30' })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'invalid appointment date or slot' })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('returns 409 when the slot is already booked', async () => {
    const neq = vi.fn().mockResolvedValue({
      data: [{ id: 'existing' }],
      error: null
    })
    const eq = vi.fn().mockReturnValue({ neq })
    const select = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabase.from).mockReturnValue({ select } as never)

    const response = await request(buildApp())
      .post('/api/appointments')
      .send(payload)

    expect(response.status).toBe(409)
    expect(response.body).toEqual({ error: 'slot already booked' })
  })

  it('returns the database error when checking the slot fails', async () => {
    const neq = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'check boom' }
    })
    const eq = vi.fn().mockReturnValue({ neq })
    const select = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabase.from).mockReturnValue({ select } as never)

    const response = await request(buildApp())
      .post('/api/appointments')
      .send(payload)

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ error: 'check boom' })
  })

  it('inserts the appointment in Taipei time and returns 201', async () => {
    const neq = vi.fn().mockResolvedValue({ data: [], error: null })
    const eq = vi.fn().mockReturnValue({ neq })
    const select = vi.fn().mockReturnValue({ eq })
    const insert = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      select,
      insert
    } as never)

    const response = await request(buildApp())
      .post('/api/appointments')
      .send(payload)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ success: true })
    expect(eq).toHaveBeenCalledWith(
      'appointment_date',
      '2026-08-01T01:00:00.000Z'
    )
    expect(insert).toHaveBeenCalledWith([
      {
        client_name: 'Jasmine',
        client_email: 'jasmine@example.com',
        appointment_date: '2026-08-01T01:00:00.000Z',
        contact: '[Line ID] jasmine_line',
        message: 'wants career advice',
        status: 'pending'
      }
    ])
  })

  it('returns the database error when insertion fails', async () => {
    const neq = vi.fn().mockResolvedValue({ data: [], error: null })
    const eq = vi.fn().mockReturnValue({ neq })
    const select = vi.fn().mockReturnValue({ eq })
    const insert = vi.fn().mockResolvedValue({
      error: { message: 'insert boom' }
    })
    vi.mocked(supabase.from).mockReturnValue({
      select,
      insert
    } as never)

    const response = await request(buildApp())
      .post('/api/appointments')
      .send(payload)

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ error: 'insert boom' })
  })
})
