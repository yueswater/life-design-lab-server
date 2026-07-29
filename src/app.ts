import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import { appointmentsRouter } from './routes/appointments.ts'
import { postsRouter } from './routes/posts.ts'
import { adminRouter } from './routes/admin.ts'

// Allows the configured production origin (with or without the "www." prefix)
// plus any Vercel preview deployment (they get a random *.vercel.app URL per
// deploy, so no fixed origin works there).
const VERCEL_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+\.vercel\.app$/

function isAllowedOrigin(origin: string): boolean {
  const configured = process.env.CORS_ORIGIN
  if (!configured) return false
  const withWww = configured.replace('https://', 'https://www.')
  return origin === configured || origin === withWww || VERCEL_PREVIEW_PATTERN.test(origin)
}

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || isAllowedOrigin(origin)) {
          callback(null, true)
          return
        }
        callback(new Error('Not allowed by CORS'))
      },
      credentials: true
    })
  )
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
