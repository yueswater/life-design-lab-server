export function readPort() {
  const value = process.env.PORT?.trim()

  if (!value) {
    throw new Error('PORT must be configured in .env')
  }

  const port = Number(value)

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535')
  }

  return port
}
