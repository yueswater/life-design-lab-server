import 'dotenv/config'
import { createApp } from './app.ts'

const port = process.env.PORT ? Number(process.env.PORT) : 3001

createApp().listen(port, () => {
  console.log(`server listening on port ${port}`)
})
