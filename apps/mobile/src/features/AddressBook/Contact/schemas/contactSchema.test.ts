import { faker } from '@faker-js/faker'
import { contactSchema, ContactFormData } from './contactSchema'
import { getAddress } from 'ethers'

const validChecksummedAddress = getAddress(faker.finance.ethereumAddress())

describe('contactSchema', () => {
  describe('name validation', () => {
    it('accepts valid name', () => {
      const data: ContactFormData = {
        name: 'Alice',
        address: validChecksummedAddress,
      }

      const result = contactSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const data = {
        name: '',
        address: validChecksummedAddress,
      }

      const result = contactSchema.safeParse(data)

      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Name is required')
    })

    it('rejects whitespace-only name', () => {
      const data = {
        name: '   ',
        address: validChecksummedAddress,
      }

      const result = contactSchema.safeParse(data)

      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Name cannot be empty or only whitespace')
    })

    it('rejects name exceeding 50 characters', () => {
      const data = {
        name: 'a'.repeat(51),
        address: validChecksummedAddress,
      }

      const result = contactSchema.safeParse(data)

      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Name is too long')
    })

    it('accepts name with exactly 50 characters', () => {
      const data: ContactFormData = {
        name: 'a'.repeat(50),
        address: validChecksummedAddress,
      }

      const result = contactSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it('accepts name with leading/trailing spaces when content exists', () => {
      const data: ContactFormData = {
        name: '  Bob  ',
        address: validChecksummedAddress,
      }

      const result = contactSchema.safeParse(data)

      expect(result.success).toBe(true)
    })
  })

  describe('address validation', () => {
    it('accepts valid checksummed address', () => {
      const data: ContactFormData = {
        name: 'Alice',
        address: validChecksummedAddress,
      }

      const result = contactSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it('accepts prefixed address', () => {
      const data: ContactFormData = {
        name: 'Alice',
        address: `eth:${validChecksummedAddress}`,
      }

      const result = contactSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it('rejects empty address', () => {
      const data = {
        name: 'Alice',
        address: '',
      }

      const result = contactSchema.safeParse(data)

      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Address is required')
    })

    it('rejects invalid address format', () => {
      const data = {
        name: 'Alice',
        address: 'not-an-address',
      }

      const result = contactSchema.safeParse(data)

      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Invalid Ethereum address format')
    })

    it('rejects address with wrong length', () => {
      const data = {
        name: 'Alice',
        address: '0x123',
      }

      const result = contactSchema.safeParse(data)

      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Invalid Ethereum address format')
    })

    it('accepts lowercase address (gets checksummed by parsePrefixedAddress)', () => {
      const data: ContactFormData = {
        name: 'Alice',
        address: validChecksummedAddress.toLowerCase(),
      }

      const result = contactSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it('rejects address with invalid hex characters', () => {
      const data = {
        name: 'Alice',
        address: '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      }

      const result = contactSchema.safeParse(data)

      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Invalid Ethereum address format')
    })
  })
})
