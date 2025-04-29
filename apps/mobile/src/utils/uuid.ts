import crypto from 'react-native-quick-crypto'

/**
 * Converts a device ID to a proper RFC4122-compliant UUID v4
 * @param deviceId The device ID to convert
 * @returns A valid UUID v4 string in format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export const convertToUuid = (deviceId: string): string => {
  // If already in UUID format, return as is
  if (deviceId.includes('-')) {
    return deviceId
  }

  // Generate deterministic "random" bytes based on the device ID
  const randomBytes = crypto.createHash('md5').update(deviceId).digest('hex')

  // Format as UUID v4
  return (
    randomBytes.substring(0, 8) +
    '-' +
    randomBytes.substring(8, 12) +
    '-' +
    // Set version bits (bits 12-15 of time_hi_and_version) to 0100 (version 4)
    '4' +
    randomBytes.substring(13, 16) +
    '-' +
    // Set variant bits (bits 6-7 of clock_seq_hi_and_reserved) to 10
    // (8, 9, a, or b) followed by the rest
    ((parseInt(randomBytes.charAt(16), 16) & 0x3) | 0x8).toString(16) +
    randomBytes.substring(17, 20) +
    '-' +
    randomBytes.substring(20, 32)
  )
}

/**
 * Validates if a string is a valid UUID
 * @param uuid String to validate
 * @returns True if the string is a valid UUID
 */
export const isValidUuid = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
