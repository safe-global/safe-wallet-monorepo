import { mapVisibleAnalysisResults } from '../mapVisibleAnalysisResults'
import type { RecipientAnalysisResults } from '../../types'
import { faker } from '@faker-js/faker'
import { Severity, StatusGroup, RecipientStatus } from '../../types'
import { RecipientAnalysisResultBuilder } from '../../builders'

describe('mapVisibleAnalysisResults', () => {
  describe('single address', () => {
    it('should return primary result from each group for a single address', () => {
      const address1 = faker.finance.ethereumAddress()

      const addressesResultsMap: RecipientAnalysisResults = {
        [address1]: {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
          [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
        },
      }

      const result = mapVisibleAnalysisResults(addressesResultsMap)

      expect(result).toHaveLength(2)
      expect(result[0].severity).toBe(Severity.WARN) // Higher priority
      expect(result[0].type).toBe(RecipientStatus.LOW_ACTIVITY)
      expect(result[1].severity).toBe(Severity.OK)
      expect(result[1].type).toBe(RecipientStatus.KNOWN_RECIPIENT)
    })

    it('should handle single address with one group', () => {
      const address1 = faker.finance.ethereumAddress()

      const addressesResultsMap: RecipientAnalysisResults = {
        [address1]: { [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.unknownRecipient().build()] },
      }

      const result = mapVisibleAnalysisResults(addressesResultsMap)

      expect(result).toHaveLength(1)
      expect(result[0].severity).toBe(Severity.INFO)
      expect(result[0].type).toBe(RecipientStatus.UNKNOWN_RECIPIENT)
    })

    it('should select highest severity result when group has multiple results', () => {
      const address1 = faker.finance.ethereumAddress()

      const addressesResultsMap: RecipientAnalysisResults = {
        [address1]: {
          [StatusGroup.ADDRESS_BOOK]: [
            RecipientAnalysisResultBuilder.knownRecipient().build(),
            RecipientAnalysisResultBuilder.unknownRecipient().build(),
          ],
        },
      }

      const result = mapVisibleAnalysisResults(addressesResultsMap)

      expect(result).toHaveLength(1)
      expect(result[0].severity).toBe(Severity.INFO)
      expect(result[0].title).toBe('Unknown recipient')
    })

    it('should filter out empty groups', () => {
      const address1 = faker.finance.ethereumAddress()

      const addressesResultsMap: RecipientAnalysisResults = {
        [address1]: {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
          [StatusGroup.RECIPIENT_ACTIVITY]: [],
        },
      }

      const result = mapVisibleAnalysisResults(addressesResultsMap)

      expect(result).toHaveLength(1)
      expect(result[0].type).toBe(RecipientStatus.KNOWN_RECIPIENT)
    })

    it('should return empty array for address with no results', () => {
      const address1 = faker.finance.ethereumAddress()

      const addressesResultsMap: RecipientAnalysisResults = {
        [address1]: {},
      }

      const result = mapVisibleAnalysisResults(addressesResultsMap)

      expect(result).toEqual([])
    })
  })

  describe('multiple addresses', () => {
    it('should consolidate results for multiple addresses and have a primary result', () => {
      const address1 = faker.finance.ethereumAddress()
      const address2 = faker.finance.ethereumAddress()

      const addressesResultsMap: RecipientAnalysisResults = {
        [address1]: { [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()] },

        [address2]: { [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.unknownRecipient().build()] },
      }

      const result = mapVisibleAnalysisResults(addressesResultsMap)

      expect(result.length).toBe(1)
      expect(result[0].severity).toBe(Severity.INFO)
      expect(result[0].type).toBe(RecipientStatus.UNKNOWN_RECIPIENT)
    })

    it('should handle multiple addresses with same status type', () => {
      const address1 = faker.finance.ethereumAddress()
      const address2 = faker.finance.ethereumAddress()

      const addressesResultsMap: RecipientAnalysisResults = {
        [address1]: {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        },
        [address2]: {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        },
      }

      const result = mapVisibleAnalysisResults(addressesResultsMap)

      expect(result.length).toBe(1)
      expect(result[0].description).toContain('All these addresses are in your address book or a Safe you own.')
    })

    it('should return empty array for multiple addresses with no results', () => {
      const address1 = faker.finance.ethereumAddress()
      const address2 = faker.finance.ethereumAddress()
      const address3 = faker.finance.ethereumAddress()

      const addressesResultsMap: RecipientAnalysisResults = {
        [address1]: {},
        [address2]: {},
        [address3]: {},
      }

      const result = mapVisibleAnalysisResults(addressesResultsMap)

      expect(result).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const addressesResultsMap: RecipientAnalysisResults = {}

      const result = mapVisibleAnalysisResults(addressesResultsMap)

      expect(result).toEqual([])
    })

    it('should sort results by severity priority', () => {
      const address1 = faker.finance.ethereumAddress()

      const addressesResultsMap: RecipientAnalysisResults = {
        [address1]: {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
          [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
          [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
        },
      }

      const result = mapVisibleAnalysisResults(addressesResultsMap)

      expect(result).toHaveLength(3)
      expect(result[0].severity).toBe(Severity.WARN)
      expect(result[1].severity).toBe(Severity.INFO)
      expect(result[2].severity).toBe(Severity.OK)
    })

    it('should skip non-array group results for single address', () => {
      const address1 = faker.finance.ethereumAddress()

      const addressesResultsMap: RecipientAnalysisResults = {
        [address1]: {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
          [StatusGroup.RECIPIENT_ACTIVITY]: null as any, // Non-array value
          [StatusGroup.RECIPIENT_INTERACTION]: {} as any, // Non-array value
        },
      }

      const result = mapVisibleAnalysisResults(addressesResultsMap)

      expect(result).toHaveLength(1)
      expect(result[0].severity).toBe(Severity.OK)
      expect(result[0].type).toBe(RecipientStatus.KNOWN_RECIPIENT)
    })

    it('should handle mixed array and non-array group results for single address', () => {
      const address1 = faker.finance.ethereumAddress()

      const addressesResultsMap: RecipientAnalysisResults = {
        [address1]: {
          [StatusGroup.ADDRESS_BOOK]: undefined as any, // Non-array value
          [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
          [StatusGroup.RECIPIENT_INTERACTION]: 'invalid' as any, // Non-array value
        },
      }

      const result = mapVisibleAnalysisResults(addressesResultsMap)

      expect(result).toHaveLength(1)
      expect(result[0].severity).toBe(Severity.WARN)
      expect(result[0].type).toBe(RecipientStatus.LOW_ACTIVITY)
    })

    it('should return empty array when all group results are non-array for single address', () => {
      const address1 = faker.finance.ethereumAddress()

      const addressesResultsMap: RecipientAnalysisResults = {
        [address1]: {
          [StatusGroup.ADDRESS_BOOK]: null as any,
          [StatusGroup.RECIPIENT_ACTIVITY]: {} as any,
          [StatusGroup.RECIPIENT_INTERACTION]: 'invalid' as any,
        },
      }

      const result = mapVisibleAnalysisResults(addressesResultsMap)

      expect(result).toEqual([])
    })
  })
})
