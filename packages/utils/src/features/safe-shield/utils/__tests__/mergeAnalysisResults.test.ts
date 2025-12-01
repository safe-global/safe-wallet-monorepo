import { mergeAnalysisResults } from '../mergeAnalysisResults'
import { RecipientStatus, StatusGroup } from '../../types'
import type { AddressBookCheckResult } from '../../hooks/address-analysis/address-book-check/useAddressBookCheck'
import type { AddressActivityResult } from '../../hooks/address-analysis/address-activity/useAddressActivity'
import type { RecipientAnalysisResults } from '../../types'
import { getAddress } from 'ethers'
import { faker } from '@faker-js/faker'
import { RecipientAnalysisResultBuilder } from '../../builders'

describe('mergeAnalysisResults', () => {
  const address1 = faker.finance.ethereumAddress()
  const address2 = faker.finance.ethereumAddress()
  const address1Checksum = getAddress(address1)
  const address2Checksum = getAddress(address2)

  describe('basic merging', () => {
    it('should merge address book results into empty fetched results', () => {
      const addressBookResult: AddressBookCheckResult = {
        [address1]: RecipientAnalysisResultBuilder.knownRecipient().build(),
      }

      const result = mergeAnalysisResults(undefined, addressBookResult, undefined)

      expect(result[address1Checksum]).toBeDefined()
      expect(result[address1Checksum][StatusGroup.ADDRESS_BOOK]).toHaveLength(1)
      expect(result[address1Checksum][StatusGroup.ADDRESS_BOOK]?.[0].type).toBe(RecipientStatus.KNOWN_RECIPIENT)
    })

    it('should merge activity results into empty fetched results', () => {
      const activityResult: AddressActivityResult = {
        [address1]: RecipientAnalysisResultBuilder.lowActivity().build(),
      }

      const result = mergeAnalysisResults(undefined, {}, activityResult)

      expect(result[address1Checksum]).toBeDefined()
      expect(result[address1Checksum][StatusGroup.RECIPIENT_ACTIVITY]).toHaveLength(1)
      expect(result[address1Checksum][StatusGroup.RECIPIENT_ACTIVITY]?.[0].type).toBe(RecipientStatus.LOW_ACTIVITY)
    })

    it('should merge both address book and activity results', () => {
      const addressBookResult: AddressBookCheckResult = {
        [address1]: RecipientAnalysisResultBuilder.knownRecipient().build(),
      }

      const activityResult: AddressActivityResult = {
        [address1]: RecipientAnalysisResultBuilder.lowActivity().build(),
      }

      const result = mergeAnalysisResults(undefined, addressBookResult, activityResult)

      expect(result[address1Checksum]).toBeDefined()
      expect(result[address1Checksum][StatusGroup.ADDRESS_BOOK]).toHaveLength(1)
      expect(result[address1Checksum][StatusGroup.RECIPIENT_ACTIVITY]).toHaveLength(1)
      expect(result[address1Checksum][StatusGroup.ADDRESS_BOOK]?.[0].type).toBe(RecipientStatus.KNOWN_RECIPIENT)
      expect(result[address1Checksum][StatusGroup.RECIPIENT_ACTIVITY]?.[0].type).toBe(RecipientStatus.LOW_ACTIVITY)
    })
  })

  describe('merging with existing fetched results', () => {
    it('should preserve existing RECIPIENT_INTERACTION results from backend', () => {
      const fetchedResults: RecipientAnalysisResults = {
        [address1Checksum]: {
          [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.recurringRecipient().build()],
        },
      }

      const addressBookResult: AddressBookCheckResult = {
        [address1]: RecipientAnalysisResultBuilder.knownRecipient().build(),
      }

      const result = mergeAnalysisResults(fetchedResults, addressBookResult, undefined)

      expect(result[address1Checksum][StatusGroup.RECIPIENT_INTERACTION]).toHaveLength(1)
      expect(result[address1Checksum][StatusGroup.ADDRESS_BOOK]).toHaveLength(1)
      expect(result[address1Checksum][StatusGroup.RECIPIENT_INTERACTION]?.[0].type).toBe(
        RecipientStatus.RECURRING_RECIPIENT,
      )
    })

    it('should merge all three result types (fetched + address book + activity)', () => {
      const fetchedResults: RecipientAnalysisResults = {
        [address1Checksum]: {
          [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
        },
      }

      const addressBookResult: AddressBookCheckResult = {
        [address1]: RecipientAnalysisResultBuilder.unknownRecipient().build(),
      }

      const activityResult: AddressActivityResult = {
        [address1]: RecipientAnalysisResultBuilder.lowActivity().build(),
      }

      const result = mergeAnalysisResults(fetchedResults, addressBookResult, activityResult)

      expect(result[address1Checksum][StatusGroup.RECIPIENT_INTERACTION]).toHaveLength(1)
      expect(result[address1Checksum][StatusGroup.ADDRESS_BOOK]).toHaveLength(1)
      expect(result[address1Checksum][StatusGroup.RECIPIENT_ACTIVITY]).toHaveLength(1)
    })
  })

  describe('multiple addresses', () => {
    it('should handle multiple addresses independently', () => {
      const fetchedResults: RecipientAnalysisResults = {
        [address1Checksum]: {
          [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.recurringRecipient().build()],
        },
      }

      const addressBookResult: AddressBookCheckResult = {
        [address1]: RecipientAnalysisResultBuilder.knownRecipient().build(),
        [address2]: RecipientAnalysisResultBuilder.unknownRecipient().build(),
      }

      const activityResult: AddressActivityResult = {
        [address2]: RecipientAnalysisResultBuilder.lowActivity().build(),
      }

      const result = mergeAnalysisResults(fetchedResults, addressBookResult, activityResult)

      // Address 1 (checksummed) - has RECIPIENT_INTERACTION and ADDRESS_BOOK but no activity result (high activity)
      expect(result[address1Checksum][StatusGroup.RECIPIENT_INTERACTION]).toHaveLength(1)
      expect(result[address1Checksum][StatusGroup.ADDRESS_BOOK]).toHaveLength(1)
      expect(result[address1Checksum][StatusGroup.RECIPIENT_ACTIVITY]).toBeUndefined()

      // Address 2 (checksummed)
      expect(result[address2Checksum]).toBeDefined()
      expect(result[address2Checksum][StatusGroup.RECIPIENT_INTERACTION]).toBeUndefined()
      expect(result[address2Checksum][StatusGroup.ADDRESS_BOOK]).toHaveLength(1)
      expect(result[address2Checksum][StatusGroup.RECIPIENT_ACTIVITY]).toHaveLength(1)
    })
  })

  describe('edge cases', () => {
    it('should handle undefined fetched results', () => {
      const result = mergeAnalysisResults(undefined, {}, undefined)
      expect(result).toEqual({})
    })

    it('should handle empty address book results', () => {
      const fetchedResults: RecipientAnalysisResults = {
        [address1Checksum]: {
          [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.recurringRecipient().build()],
        },
      }

      const result = mergeAnalysisResults(fetchedResults, {}, undefined)

      expect(result[address1Checksum][StatusGroup.RECIPIENT_INTERACTION]).toHaveLength(1)
      expect(result[address1Checksum][StatusGroup.ADDRESS_BOOK]).toBeUndefined()
    })

    it('should handle undefined activity results', () => {
      const addressBookResult: AddressBookCheckResult = {
        [address1]: RecipientAnalysisResultBuilder.knownRecipient().build(),
      }

      const result = mergeAnalysisResults(undefined, addressBookResult, undefined)

      expect(result[address1Checksum][StatusGroup.ADDRESS_BOOK]).toHaveLength(1)
      expect(result[address1Checksum][StatusGroup.RECIPIENT_ACTIVITY]).toBeUndefined()
    })

    it('should not mutate the original fetched results', () => {
      const fetchedResults: RecipientAnalysisResults = {
        [address1Checksum]: {
          [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.recurringRecipient().build()],
        },
      }

      const originalCopy = JSON.parse(JSON.stringify(fetchedResults))

      const addressBookResult: AddressBookCheckResult = {
        [address1]: RecipientAnalysisResultBuilder.knownRecipient().build(),
      }

      mergeAnalysisResults(fetchedResults, addressBookResult, undefined)

      expect(fetchedResults).toEqual(originalCopy)
    })

    it('should handle empty objects for all parameters', () => {
      const result = mergeAnalysisResults({}, {}, undefined)
      expect(result).toEqual({})
    })
  })

  describe('data integrity', () => {
    it('should preserve all properties of results', () => {
      const addressBookResult: AddressBookCheckResult = {
        [address1]: RecipientAnalysisResultBuilder.knownRecipient()
          .title('Test Title')
          .description('Test Description')
          .build(),
      }

      const result = mergeAnalysisResults(undefined, addressBookResult, undefined)

      const addressBookEntry = result[address1Checksum][StatusGroup.ADDRESS_BOOK]?.[0]
      expect(addressBookEntry?.type).toBe(RecipientStatus.KNOWN_RECIPIENT)
      expect(addressBookEntry?.title).toBe('Test Title')
      expect(addressBookEntry?.description).toBe('Test Description')
    })

    it('should create new objects for merged results', () => {
      const fetchedResults: RecipientAnalysisResults = {
        [address1Checksum]: {
          [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.recurringRecipient().build()],
        },
      }

      const addressBookResult: AddressBookCheckResult = {
        [address1]: RecipientAnalysisResultBuilder.knownRecipient().build(),
      }

      const result = mergeAnalysisResults(fetchedResults, addressBookResult, undefined)

      // Verify that modifying the result doesn't affect the original
      result[address1Checksum][StatusGroup.ADDRESS_BOOK] = []
      expect(fetchedResults[address1Checksum][StatusGroup.ADDRESS_BOOK]).toBeUndefined()
    })
  })
})
