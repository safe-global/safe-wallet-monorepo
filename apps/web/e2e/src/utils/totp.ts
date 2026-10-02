import { createHmac } from 'node:crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const DEFAULT_STEP_SECONDS = 30
const DEFAULT_DIGITS = 6

export function decodeBase32(secret: string): Buffer {
  const clean = secret.replace(/[\s=]/g, '').toUpperCase()
  let bits = ''
  for (const char of clean) {
    const value = BASE32_ALPHABET.indexOf(char)
    if (value === -1) throw new Error(`Invalid base32 character "${char}" in TOTP secret`)
    bits += value.toString(2).padStart(5, '0')
  }
  const bytes = bits.match(/.{8}/g) ?? []
  return Buffer.from(bytes.map((byte) => parseInt(byte, 2)))
}

/** RFC 6238 TOTP (HMAC-SHA1), the algorithm authenticator apps use for Auth0 enrollments. */
export function generateTotp(
  secret: string,
  { timestampMs = Date.now(), stepSeconds = DEFAULT_STEP_SECONDS, digits = DEFAULT_DIGITS } = {},
): string {
  const counter = Math.floor(timestampMs / 1000 / stepSeconds)
  const counterBytes = Buffer.alloc(8)
  counterBytes.writeBigUInt64BE(BigInt(counter))

  const hmac = createHmac('sha1', decodeBase32(secret)).update(counterBytes).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff

  return String(binary % 10 ** digits).padStart(digits, '0')
}

export function secondsLeftInStep(timestampMs = Date.now(), stepSeconds = DEFAULT_STEP_SECONDS): number {
  return stepSeconds - (Math.floor(timestampMs / 1000) % stepSeconds)
}
