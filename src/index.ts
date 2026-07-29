import 'dotenv/config'
import { createApp } from './app.ts'
import { readPort } from './config.ts'

const port = readPort()

createApp().listen(port, () => {
  console.log(`server listening on port ${port}`)
})
