import QuickCrypto from 'react-native-quick-crypto'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

const encodeBase32 = (bytes: number[] | Uint8Array) => {
  let bits = ''
  for (let i = 0; i < bytes.length; i++) {
    bits += bytes[i].toString(2).padStart(8, '0')
  }
  return (
    bits
      .match(/.{1,5}/g)
      ?.map((chunk) => alphabet[parseInt(chunk.padEnd(5, '0'), 2)])
      .join('') || ''
  )
}

const decodeBase32 = (key: string) => {
  const bits = key
    .split('')
    .map((char) => alphabet.indexOf(char).toString(2).padStart(5, '0'))
    .join('')
  return bits.match(/.{1,8}/g)?.map((byte) => parseInt(byte, 2)) || []
}

export const deriveBase32Key = async (secretBase32: string, hexInput: string): Promise<string> => {
  // Decode Base32 secret into bytes
  const secretBytes = decodeBase32(secretBase32.toUpperCase())

  // Convert hex string into bytes
  const hexBytes = new Uint8Array(hexInput.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))

  const derivedKey = QuickCrypto.Hmac('SHA-256', new Uint8Array(secretBytes)).update(hexBytes).digest()
  const derivedKeyBytes = new Uint8Array(derivedKey)

  // Convert derived bits to Base32
  return encodeBase32(derivedKeyBytes).replace(/=/g, '') // Remove padding
}
