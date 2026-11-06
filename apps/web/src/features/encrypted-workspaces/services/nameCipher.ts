// CGW only accepts names made of Unicode letters and a few punctuation marks, and counts their length
// in code points. Each letter below is a CJK or Hangul letter that stays the same under NFC, so one
// letter carries 15 bits of ciphertext and still passes CGW's name rules.
const BITS_PER_LETTER = 15
const ALPHABET_SIZE = 1 << BITS_PER_LETTER
const LETTER_RANGES: Array<[number, number]> = [
  [0x3400, 0x4db5],
  [0x4e00, 0x9fa5],
  [0xac00, 0xd7a3],
]

const LETTERS: number[] = LETTER_RANGES.flatMap(([from, to]) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index),
).slice(0, ALPHABET_SIZE)

const LETTER_INDEX = new Map(LETTERS.map((codePoint, index) => [codePoint, index]))

export const ENCRYPTED_NAME_MARKER = 'ꙮ'

const IV_BYTES = 12
const TAG_BITS = 96
const OVERHEAD_BYTES = IV_BYTES + TAG_BITS / 8

const payloadBytesFor = (letterCount: number) => Math.floor((letterCount * BITS_PER_LETTER) / 8)

const toLetters = (bytes: Uint8Array, letterCount: number): string => {
  let letters = ''
  let buffer = 0
  let bits = 0
  let byteIndex = 0

  for (let i = 0; i < letterCount; i++) {
    while (bits < BITS_PER_LETTER) {
      buffer = (buffer << 8) | (bytes[byteIndex++] ?? 0)
      bits += 8
    }
    bits -= BITS_PER_LETTER
    letters += String.fromCodePoint(LETTERS[(buffer >> bits) & (ALPHABET_SIZE - 1)])
    buffer &= (1 << bits) - 1
  }

  return letters
}

const fromLetters = (letters: string[]): Uint8Array | undefined => {
  const bytes = new Uint8Array(payloadBytesFor(letters.length))
  let buffer = 0
  let bits = 0
  let byteIndex = 0

  for (const letter of letters) {
    const index = LETTER_INDEX.get(letter.codePointAt(0) ?? -1)
    if (index === undefined) return undefined

    buffer = (buffer << BITS_PER_LETTER) | index
    bits += BITS_PER_LETTER
    while (bits >= 8 && byteIndex < bytes.length) {
      bits -= 8
      bytes[byteIndex++] = (buffer >> bits) & 0xff
    }
    buffer &= (1 << bits) - 1
  }

  return bytes
}

export const ENCRYPTED_ENTRY_MARKER = 'Ꙭ'

export const isEncryptedName = (value: string): boolean => value.startsWith(ENCRYPTED_NAME_MARKER)

export const isEncryptedEntry = (value: string): boolean => value.startsWith(ENCRYPTED_ENTRY_MARKER)

export const capacityFor = (maxLength: number): number => payloadBytesFor(maxLength - 1) - OVERHEAD_BYTES

/** The result is always `maxLength` code points long, so CGW cannot see how long the content is. */
export const encryptBytes = async (
  bytes: Uint8Array,
  key: CryptoKey,
  maxLength: number,
  marker: string,
): Promise<string> => {
  const letterCount = maxLength - marker.length
  const capacity = capacityFor(maxLength)

  if (bytes.length > capacity) {
    throw new Error(`Encrypted names can be at most ${capacity} bytes long`)
  }

  const padded = new Uint8Array(capacity)
  padded.set(bytes)

  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: TAG_BITS }, key, padded)

  const payload = new Uint8Array(IV_BYTES + ciphertext.byteLength)
  payload.set(iv)
  payload.set(new Uint8Array(ciphertext), IV_BYTES)

  return marker + toLetters(payload, letterCount)
}

/** Returns the padded plaintext, or undefined when the value is not encrypted with this key. */
export const decryptBytes = async (value: string, key: CryptoKey): Promise<Uint8Array | undefined> => {
  const payload = fromLetters([...value].slice(1))
  if (!payload || payload.length <= OVERHEAD_BYTES) return undefined

  try {
    return new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: payload.slice(0, IV_BYTES), tagLength: TAG_BITS },
        key,
        payload.slice(IV_BYTES),
      ),
    )
  } catch {
    return undefined
  }
}

export const encryptName = (name: string, key: CryptoKey, maxLength: number): Promise<string> =>
  encryptBytes(new TextEncoder().encode(name), key, maxLength, ENCRYPTED_NAME_MARKER)

export const decryptName = async (value: string, key: CryptoKey): Promise<string | undefined> => {
  const padded = await decryptBytes(value, key)
  if (!padded) return undefined

  // Names never contain NUL: CGW and the web app both strip control characters.
  let end = padded.length
  while (end > 0 && padded[end - 1] === 0) end--
  return new TextDecoder().decode(padded.slice(0, end))
}
