import crypto from 'react-native-quick-crypto'

export type SecuredDataFile = {
  version: '1.0'
  algo: 'aes-256-gcm'
  salt: string
  rounds: number
  data: string
}

export type SerializedDataFile = {
  version: '1.0'
  data: unknown
}

export function decodeLegacyData(file: SecuredDataFile, password: string): SerializedDataFile {
  if (file.version !== '1.0' || file.algo !== 'aes-256-gcm') {
    throw new Error('Unsupported file format')
  }
  const salt = Buffer.from(file.salt, 'base64')
  const key = crypto.pbkdf2Sync(Buffer.from(password, 'utf8'), salt, file.rounds, 32, 'sha256')
  const combined = Buffer.from(file.data, 'base64')
  const iv = combined.subarray(0, 12)
  const tag = combined.subarray(combined.length - 16)
  const ciphertext = combined.subarray(12, combined.length - 16)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return JSON.parse(decrypted.toString('utf8'))
}
