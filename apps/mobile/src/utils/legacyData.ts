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

// Custom error classes for safe error categorization
export class LegacyDataPasswordError extends Error {
  constructor() {
    super('Invalid password for legacy data')
    this.name = 'LegacyDataPasswordError'
  }
}

export class LegacyDataFormatError extends Error {
  constructor() {
    super('Invalid legacy data format')
    this.name = 'LegacyDataFormatError'
  }
}

export class LegacyDataCorruptedError extends Error {
  constructor() {
    super('Legacy data appears to be corrupted')
    this.name = 'LegacyDataCorruptedError'
  }
}

export function decodeLegacyData(file: SecuredDataFile, password: string): SerializedDataFile {
  if (file.version !== '1.0' || file.algo !== 'aes-256-gcm') {
    throw new LegacyDataFormatError()
  }

  try {
    const salt = Buffer.from(file.salt, 'base64')
    const key = crypto.pbkdf2Sync(Buffer.from(password, 'utf8'), salt, file.rounds, 32, 'sha256')
    const combined = Buffer.from(file.data, 'base64')
    const iv = combined.subarray(0, 12)
    const tag = combined.subarray(combined.length - 16)
    const ciphertext = combined.subarray(12, combined.length - 16)

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)

    let decrypted: Buffer
    try {
      decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    } catch (_cryptoError) {
      // Authentication tag verification failure or decryption error = wrong password
      throw new LegacyDataPasswordError()
    }

    try {
      return JSON.parse(decrypted.toString('utf8'))
    } catch (_jsonError) {
      // Successfully decrypted but invalid JSON = corrupted data
      throw new LegacyDataCorruptedError()
    }
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof LegacyDataPasswordError || error instanceof LegacyDataCorruptedError) {
      throw error
    }

    // For any other errors (base64 decode, buffer operations, etc.)
    // assume it's a format/corruption issue
    throw new LegacyDataFormatError()
  }
}
