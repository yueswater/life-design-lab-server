import { Router } from 'express'
import { supabase } from '../lib/supabase.ts'
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionCookie,
  isAdminAuthenticated,
  verifyAdminCredentials
} from '../lib/admin-auth.ts'
import { sendBookingEmail } from '../lib/send-booking-email.ts'
import { dateFormatters, resolveLang, slotFormatter } from '../lib/booking-format.ts'
import { renderBookingConfirmedEmail } from '../emails/booking-confirmed.ts'
import { renderBookingCancelledEmail } from '../emails/booking-cancelled.ts'

export const adminRouter = Router()

const STATUSES = new Set(['pending', 'confirmed', 'cancelled'])

adminRouter.post('/login', (request, response) => {
  const body = request.body as { username?: unknown; password?: unknown }
  const username = typeof body.username === 'string' ? body.username : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!username || !password || !verifyAdminCredentials(username, password)) {
    response.status(401).json({ error: 'invalid credentials' })
    return
  }

  const { token, maxAgeMs } = createAdminSessionCookie()
  response.cookie(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs
  })
  response.json({ success: true })
})

adminRouter.post('/logout', (_request, response) => {
  response.clearCookie(ADMIN_SESSION_COOKIE, { path: '/' })
  response.json({ success: true })
})

adminRouter.get('/session', (request, response) => {
  response.json({ authenticated: isAdminAuthenticated(request) })
})

// Everything below requires a valid admin session
adminRouter.use((request, response, next) => {
  if (!isAdminAuthenticated(request)) {
    response.status(401).json({ error: 'unauthorized' })
    return
  }
  next()
})

const APPOINTMENT_COLUMNS =
  'id, created_at, updated_at, appointment_date, client_name, client_email, service, contact_platform, contact_detail, message, status, lang, cancellation_reason, is_paid'

adminRouter.get('/appointments', async (_request, response) => {
  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_COLUMNS)
    .order('appointment_date', { ascending: true })

  if (error) {
    response.status(500).json({ error: error.message })
    return
  }

  response.json(data ?? [])
})

type AppointmentRow = {
  client_name: string
  client_email: string
  service: string | null
  appointment_date: string
  lang: string | null
}

/** Sends the confirmed/cancelled notification for one appointment row. Errors are logged, never thrown. */
async function notifyStatusChange(
  row: AppointmentRow,
  status: 'confirmed' | 'cancelled',
  reason: string
): Promise<void> {
  try {
    const lang = resolveLang(row.lang)
    const appointmentDateObj = new Date(row.appointment_date)
    const dateLabel = dateFormatters[lang].format(appointmentDateObj)
    const timeLabel = slotFormatter.format(appointmentDateObj)
    const service = row.service ?? ''

    const { subject, html } =
      status === 'confirmed'
        ? renderBookingConfirmedEmail({ lang, name: row.client_name, service, dateLabel, timeLabel })
        : renderBookingCancelledEmail({ lang, name: row.client_name, service, dateLabel, timeLabel, reason })

    await sendBookingEmail({ to: row.client_email, subject, html })
  } catch (emailError) {
    console.error(`Failed to send booking ${status} email:`, emailError)
  }
}

type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled'

function parseStatusUpdate(body: unknown): { status: AppointmentStatus; reason: string } | null {
  const b = body as { status?: unknown; reason?: unknown }
  const status = typeof b.status === 'string' ? b.status : ''
  const reason = typeof b.reason === 'string' ? b.reason.trim() : ''
  if (!STATUSES.has(status)) return null
  if (status === 'cancelled' && !reason) return null
  return { status: status as AppointmentStatus, reason }
}

// Registered before the `/appointments/:id` route below — Express would
// otherwise match "batch" as the :id wildcard and this route would never fire.
adminRouter.patch('/appointments/batch', async (request, response) => {
  const body = request.body as { ids?: unknown }
  const ids = Array.isArray(body.ids) ? body.ids.filter((v): v is string => typeof v === 'string') : []
  const parsed = parseStatusUpdate(request.body)

  if (ids.length === 0 || !parsed) {
    response.status(400).json({ error: 'invalid ids, status, or missing cancellation reason' })
    return
  }
  const { status, reason } = parsed

  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'cancelled') update.cancellation_reason = reason

  const { data, error } = await supabase
    .from('appointments')
    .update(update)
    .in('id', ids)
    .select(APPOINTMENT_COLUMNS)

  if (error) {
    response.status(500).json({ error: error.message })
    return
  }

  response.json({ success: true, updated: data?.length ?? 0 })

  if (status !== 'pending' && data) {
    for (const row of data) {
      void notifyStatusChange(row, status, reason)
    }
  }
})

adminRouter.patch('/appointments/:id/paid', async (request, response) => {
  const { id } = request.params
  const body = request.body as { isPaid?: unknown }
  if (typeof body.isPaid !== 'boolean') {
    response.status(400).json({ error: 'isPaid must be a boolean' })
    return
  }

  const { error } = await supabase
    .from('appointments')
    .update({ is_paid: body.isPaid, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    response.status(500).json({ error: error.message })
    return
  }

  response.json({ success: true })
})

adminRouter.patch('/appointments/:id', async (request, response) => {
  const { id } = request.params
  const parsed = parseStatusUpdate(request.body)

  if (!parsed) {
    response.status(400).json({ error: 'invalid status or missing cancellation reason' })
    return
  }
  const { status, reason } = parsed

  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'cancelled') update.cancellation_reason = reason

  const { data, error } = await supabase
    .from('appointments')
    .update(update)
    .eq('id', id)
    .select(APPOINTMENT_COLUMNS)
    .single()

  if (error) {
    response.status(500).json({ error: error.message })
    return
  }

  response.json({ success: true })

  // Status is already saved — a flaky email provider should never turn a
  // successful status change into a failed request.
  if (status !== 'pending' && data) {
    void notifyStatusChange(data, status, reason)
  }
})
