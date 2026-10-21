import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { RECIPIENT_DUPLICATE_ERROR, RECIPIENT_IS_SAFE_ERROR, RECIPIENT_RESERVED_ERROR } from '../../constants'
import { createDefaultAllowlistValues, type AllowlistRecipient, type RecipientAllowlistFormValues } from '../../types'
import {
  buildAllowlistRules,
  getAllowedTokenAddresses,
  getFormTokenAddresses,
  getSelectedRecipients,
  isAllowlistComplete,
  validateAllowlistRecipient,
} from '../allowlistForm'

const address = () => getAddress(faker.finance.ethereumAddress())
const recipient = (overrides: Partial<AllowlistRecipient> = {}): AllowlistRecipient => ({
  address: address(),
  selected: true,
  ...overrides,
})
const values = (overrides: Partial<RecipientAllowlistFormValues> = {}): RecipientAllowlistFormValues => ({
  ...createDefaultAllowlistValues(),
  ...overrides,
})

describe('allowlistForm', () => {
  describe('createDefaultAllowlistValues', () => {
    it('starts with nothing excluded, added or listed', () => {
      expect(createDefaultAllowlistValues()).toEqual({ excludedTokens: [], addedTokens: [], recipients: [] })
    })
  })

  describe('getFormTokenAddresses', () => {
    it('lists an added token that is also held once, held tokens first', () => {
      const held = address()
      const added = address()

      const result = getFormTokenAddresses([held], values({ addedTokens: [added, held.toLowerCase()] }))

      expect(result).toEqual([held, added])
    })
  })

  describe('getAllowedTokenAddresses', () => {
    it('omits excluded tokens case-insensitively', () => {
      const [a, b] = [address(), address()]

      expect(getAllowedTokenAddresses([a, b], values({ excludedTokens: [a.toLowerCase()] }))).toEqual([b])
    })
  })

  describe('getSelectedRecipients', () => {
    it('omits deselected recipients', () => {
      const kept = recipient()

      expect(getSelectedRecipients(values({ recipients: [kept, recipient({ selected: false })] }))).toEqual([kept])
    })
  })

  describe('buildAllowlistRules', () => {
    it('returns one rule per allowed token listing every selected recipient, native included', () => {
      const token = address()
      const [r1, r2] = [recipient(), recipient()]

      const rules = buildAllowlistRules([ZERO_ADDRESS, token], values({ recipients: [r1, r2] }))

      expect(rules).toEqual([
        { tokenAddress: ZERO_ADDRESS, recipients: [r1.address, r2.address] },
        { tokenAddress: token, recipients: [r1.address, r2.address] },
      ])
    })

    it('omits excluded tokens and deselected recipients', () => {
      const [kept, dropped] = [address(), address()]
      const selected = recipient()

      const rules = buildAllowlistRules(
        [kept, dropped],
        values({ excludedTokens: [dropped], recipients: [selected, recipient({ selected: false })] }),
      )

      expect(rules).toEqual([{ tokenAddress: kept, recipients: [selected.address] }])
    })

    it('returns no rules when there are no selected recipients', () => {
      expect(buildAllowlistRules([address()], values())).toEqual([])
      expect(buildAllowlistRules([address()], values({ recipients: [recipient({ selected: false })] }))).toEqual([])
    })

    it('includes an added token that is also held once', () => {
      const token = address()

      const rules = buildAllowlistRules(
        [token],
        values({ addedTokens: [token.toLowerCase()], recipients: [recipient()] }),
      )

      expect(rules).toHaveLength(1)
    })

    it('checksums the output addresses', () => {
      const token = address()
      const r = recipient()
      const lower = { ...r, address: r.address.toLowerCase() }

      const rules = buildAllowlistRules([token.toLowerCase()], values({ recipients: [lower] }))

      expect(rules).toEqual([{ tokenAddress: token, recipients: [r.address] }])
    })
  })

  describe('isAllowlistComplete', () => {
    it('is false with zero allowed tokens', () => {
      const token = address()

      expect(isAllowlistComplete([token], values({ excludedTokens: [token], recipients: [recipient()] }))).toBe(false)
      expect(isAllowlistComplete([], values({ recipients: [recipient()] }))).toBe(false)
    })

    it('is false with zero selected recipients', () => {
      expect(isAllowlistComplete([address()], values({ recipients: [recipient({ selected: false })] }))).toBe(false)
    })

    it('is true with an allowed token and a selected recipient', () => {
      expect(isAllowlistComplete([address()], values({ recipients: [recipient()] }))).toBe(true)
    })
  })

  describe('validateAllowlistRecipient', () => {
    const safeAddress = address()

    it('rejects the Safe itself, whatever the case', () => {
      expect(validateAllowlistRecipient(safeAddress.toLowerCase(), { safeAddress, existing: [] })).toBe(
        RECIPIENT_IS_SAFE_ERROR,
      )
    })

    it('rejects reserved addresses', () => {
      expect(validateAllowlistRecipient(ZERO_ADDRESS, { safeAddress, existing: [] })).toBe(RECIPIENT_RESERVED_ERROR)
    })

    it('rejects an existing recipient in another case', () => {
      const existing = recipient()

      expect(validateAllowlistRecipient(existing.address.toLowerCase(), { safeAddress, existing: [existing] })).toBe(
        RECIPIENT_DUPLICATE_ERROR,
      )
    })

    it('accepts a fresh address', () => {
      expect(validateAllowlistRecipient(address(), { safeAddress, existing: [recipient()] })).toBeUndefined()
    })
  })
})
