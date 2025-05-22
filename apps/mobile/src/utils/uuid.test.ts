import { convertToUuid, isValidUuid } from './uuid'

// Mock react-native-quick-crypto
jest.mock('react-native-quick-crypto', () => ({
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('abcdef1234567890abcdef1234567890'),
  }),
}))

describe('UUID Utilities', () => {
  describe('convertToUuid', () => {
    it('should return the same string if it already contains hyphens', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000'
      expect(convertToUuid(uuid)).toBe(uuid)
    })

    it('should convert a device ID to a valid UUID v4 format', () => {
      const deviceId = '1234567890abcdef'
      const uuid = convertToUuid(deviceId)

      // Check the format using regex
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)

      // Verify parts of the UUID
      const parts = uuid.split('-')
      expect(parts.length).toBe(5)
      expect(parts[0].length).toBe(8)
      expect(parts[1].length).toBe(4)
      expect(parts[2].length).toBe(4)
      expect(parts[2][0]).toBe('4') // Version 4
      expect(['8', '9', 'a', 'b'].includes(parts[3][0].toLowerCase())).toBeTruthy() // Variant
      expect(parts[3].length).toBe(4)
      expect(parts[4].length).toBe(12)
    })

    it('should generate the same UUID for the same device ID', () => {
      const deviceId = '1234567890abcdef'
      const uuid1 = convertToUuid(deviceId)
      const uuid2 = convertToUuid(deviceId)

      expect(uuid1).toBe(uuid2)
    })
  })

  describe('isValidUuid', () => {
    it('should return true for valid UUIDs', () => {
      expect(isValidUuid('123e4567-e89b-42d3-a456-426614174000')).toBe(true)
      expect(isValidUuid('a8098c1a-f86e-4538-8B2F-ABB9770C8BDE')).toBe(true) // Case insensitive
    })

    it('should return false for invalid UUIDs', () => {
      expect(isValidUuid('not-a-uuid')).toBe(false)
      expect(isValidUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(false) // Wrong version (not 4)
      expect(isValidUuid('123e4567-e89b-42d3-e456-426614174000')).toBe(false) // Wrong variant (not 8-b)
      expect(isValidUuid('123e4567-e89b42d3-a456-426614174000')).toBe(false) // Wrong format
      expect(isValidUuid('')).toBe(false)
    })
  })
})
