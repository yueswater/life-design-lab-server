import { afterEach, describe, expect, it } from 'vitest'
import { readPort } from '../src/config.ts'

const originalPort = process.env.PORT

afterEach(() => {
  if (originalPort === undefined) {
    delete process.env.PORT
  } else {
    process.env.PORT = originalPort
  }
})

describe('readPort', () => {
  it('reads the server port from the environment', () => {
    process.env.PORT = '4321'

    expect(readPort()).toBe(4321)
  })

  it('rejects a missing server port', () => {
    delete process.env.PORT

    expect(() => readPort()).toThrow('PORT must be configured in .env')
  })

  it('rejects an invalid server port', () => {
    process.env.PORT = 'not-a-port'

    expect(() => readPort()).toThrow(
      'PORT must be an integer between 1 and 65535'
    )
  })
})
