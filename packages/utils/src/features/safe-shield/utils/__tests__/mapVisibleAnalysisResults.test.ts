import { mapVisibleAnalysisResults } from '../mapVisibleAnalysisResults'
import { Severity, StatusGroup, RecipientStatus } from '../../types'
import type { RecipientAnalysisResults } from '../../types'
import { faker } from '@faker-js/faker'

describe('mapVisibleAnalysisResults', () => {
  describe('single address', () => {
    it('should return primary result from each group for a single address', () => {
      const address1 = faker.finance.ethereumAddress()

      const addressesResultsMap: RecipientAnalysisResults = {
        [address1]: {
          [StatusGroup.ADDRESS_BOOK]: [
            {
              severity: Severity.OK,
              type: RecipientStatus.KNOWN_RECIPIENT,
              title: 'Known recipient',
              description: 'Address is in the address book.',
            },
          ],
          [StatusGroup.RECIPIENT_ACTIVITY]: [
            {
              severity: Severity.WARN,
              type: RecipientStatus.LOW_ACTIVITY,
              title: 'Low activity recipient',
              description: 'This address has low transaction activity.',
            },
          ],
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
        [address1]: {
          [StatusGroup.ADDRESS_BOOK]: [
            {
              severity: Severity.INFO,
              type: RecipientStatus.UNKNOWN_RECIPIENT,
              title: 'Unknown recipient',
              description: 'Address is not in the address book.',
            },
          ],
        },
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
            {
              severity: Severity.OK,
              type: RecipientStatus.KNOWN_RECIPIENT,
              title: 'Known recipient',
              description: 'Recipient is known.',
            },
            {
              severity: Severity.CRITICAL,
              type: RecipientStatus.UNKNOWN_RECIPIENT,
              title: 'Critical issue',
              description: 'Critical security issue.',
            },
          ],
        },
      }

      const result = mapVisibleAnalysisResults(addressesResultsMap)

      expect(result).toHaveLength(1)
      expect(result[0].severity).toBe(Severity.CRITICAL)
      expect(result[0].title).toBe('Critical issue')
    })

    it('should filter out empty groups', () => {
      const address1 = faker.finance.ethereumAddress()

      const addressesResultsMap: RecipientAnalysisResults = {
        [address1]: {
          [StatusGroup.ADDRESS_BOOK]: [
            {
              severity: Severity.OK,
              type: RecipientStatus.KNOWN_RECIPIENT,
              title: 'Known recipient',
              description: 'Recipient is known.',
            },
          ],
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
        [address1]: {
          [StatusGroup.ADDRESS_BOOK]: [
            {
              severity: Severity.OK,
              type: RecipientStatus.KNOWN_RECIPIENT,
              title: 'Known recipient',
              description: 'Address is in the address book.',
            },
          ],
        },
        [address2]: {
          [StatusGroup.ADDRESS_BOOK]: [
            {
              severity: Severity.INFO,
              type: RecipientStatus.UNKNOWN_RECIPIENT,
              title: 'Unknown recipient',
              description: 'Address is not in the address book.',
            },
          ],
        },
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
          [StatusGroup.ADDRESS_BOOK]: [
            {
              severity: Severity.OK,
              type: RecipientStatus.KNOWN_RECIPIENT,
              title: 'Known recipient',
              description: 'Address is in the address book.',
            },
          ],
        },
        [address2]: {
          [StatusGroup.ADDRESS_BOOK]: [
            {
              severity: Severity.OK,
              type: RecipientStatus.KNOWN_RECIPIENT,
              title: 'Known recipient',
              description: 'Address is in the address book.',
            },
          ],
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
          [StatusGroup.ADDRESS_BOOK]: [
            {
              severity: Severity.OK,
              type: RecipientStatus.KNOWN_RECIPIENT,
              title: 'OK result',
              description: 'OK description',
            },
          ],
          [StatusGroup.RECIPIENT_ACTIVITY]: [
            {
              severity: Severity.CRITICAL,
              type: RecipientStatus.LOW_ACTIVITY,
              title: 'Critical result',
              description: 'Critical description',
            },
          ],
          [StatusGroup.RECIPIENT_INTERACTION]: [
            {
              severity: Severity.INFO,
              type: RecipientStatus.NEW_RECIPIENT,
              title: 'Info result',
              description: 'Info description',
            },
          ],
        },
      }

      const result = mapVisibleAnalysisResults(addressesResultsMap)

      expect(result).toHaveLength(3)
      expect(result[0].severity).toBe(Severity.CRITICAL)
      expect(result[1].severity).toBe(Severity.INFO)
      expect(result[2].severity).toBe(Severity.OK)
    })
  })
})
