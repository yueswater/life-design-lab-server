import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import { appointmentsRouter } from './routes/appointments.ts'
import { postsRouter } from './routes/posts.ts'
import { adminRouter } from './routes/admin.ts'

export function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' })
  })

  app.use('/api/posts', postsRouter)
  app.use('/api/appointments', appointmentsRouter)
  app.use('/api/admin', adminRouter)

  return app
}
