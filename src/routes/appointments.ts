import { Router } from 'express'
import { supabase } from '../lib/supabase.ts'

const TAIPEI_OFFSET = '+08:00'
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const APPOINTMENT_SLOTS = new Set([
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00'
])
const slotFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Taipei',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})

export const appointmentsRouter = Router()

function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return false
  }

  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))

  return date.toISOString().slice(0, 10) === value
}

appointmentsRouter.get('/', async (request, response) => {
  const date = typeof request.query.date === 'string' ? request.query.date : ''

  if (!date) {
    response.status(400).json({ error: 'date query param is required' })
    return
  }

  if (!isCalendarDate(date)) {
    response
      .status(400)
      .json({ error: 'date query param must be YYYY-MM-DD' })
    return
  }

  const start = new Date(`${date}T00:00:00${TAIPEI_OFFSET}`)
  const end = new Date(start.getTime() + ONE_DAY_MS)
  const { data, error } = await supabase
    .from('appointments')
    .select('appointment_date')
    .gte('appointment_date', start.toISOString())
    .lt('appointment_date', end.toISOString())
    .neq('status', 'cancelled')

  if (error) {
    response.status(500).json({ error: error.message })
    return
  }

  const slots = (data ?? []).map(
    (row: { appointment_date: string }) =>
      slotFormatter.format(new Date(row.appointment_date))
  )

  response.json(slots)
})

type AppointmentRequest = {
  name?: unknown
  email?: unknown
  contactPlatform?: unknown
  contactDetail?: unknown
  notes?: unknown
  appointmentDate?: unknown
  slot?: unknown
}

function requiredString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

appointmentsRouter.post('/', async (request, response) => {
  const body = request.body as AppointmentRequest
  const name = requiredString(body.name)
  const email = requiredString(body.email)
  const contactPlatform = requiredString(body.contactPlatform)
  const contactDetail = requiredString(body.contactDetail)
  const notes = typeof body.notes === 'string' ? body.notes.trim() : ''
  const appointmentDate = requiredString(body.appointmentDate)
  const slot = requiredString(body.slot)

  if (
    !name ||
    !email ||
    !contactPlatform ||
    !contactDetail ||
    !appointmentDate ||
    !slot
  ) {
    response.status(400).json({ error: 'missing required fields' })
    return
  }

  if (!isCalendarDate(appointmentDate) || !APPOINTMENT_SLOTS.has(slot)) {
    response.status(400).json({ error: 'invalid appointment date or slot' })
    return
  }

  const appointmentIsoDate = new Date(
    `${appointmentDate}T${slot}:00${TAIPEI_OFFSET}`
  ).toISOString()

  const { data: existing, error: checkError } = await supabase
    .from('appointments')
    .select('id')
    .eq('appointment_date', appointmentIsoDate)
    .neq('status', 'cancelled')

  if (checkError) {
    response.status(500).json({ error: checkError.message })
    return
  }

  if (existing && existing.length > 0) {
    response.status(409).json({ error: 'slot already booked' })
    return
  }

  const { error: insertError } = await supabase.from('appointments').insert([
    {
      client_name: name,
      client_email: email,
      appointment_date: appointmentIsoDate,
      contact: `[${contactPlatform}] ${contactDetail}`,
      message: notes,
      status: 'pending'
    }
  ])

  if (insertError) {
    response.status(500).json({ error: insertError.message })
    return
  }

  response.status(201).json({ success: true })
})
