import { Router } from 'express'
import { supabase } from '../lib/supabase.ts'

const TAIPEI_OFFSET = '+08:00'
const ONE_DAY_MS = 24 * 60 * 60 * 1000
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
