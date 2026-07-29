import cors from 'cors'
import express from 'express'
import { appointmentsRouter } from './routes/appointments.ts'
import { postsRouter } from './routes/posts.ts'

export function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.CORS_ORIGIN }))
  app.use(express.json())

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' })
  })

  app.use('/api/posts', postsRouter)
  app.use('/api/appointments', appointmentsRouter)

  return app
}
