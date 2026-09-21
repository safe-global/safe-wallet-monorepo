import { mapVisibleAnalysisResults } from '../mapVisibleAnalysisResults'
import type { RecipientAnalysisResults, ThreatAnalysisResult } from '../../types'
import { faker } from '@faker-js/faker'
import { Severity, StatusGroup, RecipientStatus, ThreatStatus } from '../../types'
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

    it('does not consolidate ADDRESS_POISONING — each look-alike stays individual with its address pair', () => {
      const impostorA = faker.finance.ethereumAddress()
      const impostorB = faker.finance.ethereumAddress()
      const anchorA = faker.finance.ethereumAddress()
      const anchorB = faker.finance.ethereumAddress()

      const poisoning = (entered: string, anchor: string, name: string) => ({
        severity: Severity.CRITICAL,
        type: RecipientStatus.RESEMBLES_TRUSTED_ADDRESS,
        title: 'Potential address poisoning',
        description: 'Looks similar to a saved address.',
        addresses: [{ address: entered }, { address: anchor, name }],
      })

      const addressesResultsMap = {
        [impostorA]: { [StatusGroup.ADDRESS_POISONING]: [poisoning(impostorA, anchorA, 'Alice')] },
        [impostorB]: { [StatusGroup.ADDRESS_POISONING]: [poisoning(impostorB, anchorB, 'Bob')] },
      } as RecipientAnalysisResults

      const result = mapVisibleAnalysisResults(addressesResultsMap)
      const poisoningResults = result.filter((r) => r.type === RecipientStatus.RESEMBLES_TRUSTED_ADDRESS)

      // Two separate results (NOT merged into one plural summary), each keeping its entered/anchor pair.
      expect(poisoningResults).toHaveLength(2)
      expect(poisoningResults.every((r) => r.addresses?.length === 2)).toBe(true)
      expect(poisoningResults.flatMap((r) => (r.addresses ?? []).map((a) => a.address))).toEqual(
        expect.arrayContaining([impostorA, anchorA, impostorB, anchorB]),
      )
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

describe('mapVisibleAnalysisResults with expandedGroups', () => {
  const threat = (title: string, severity: Severity) => ({
    severity,
    type: ThreatStatus.MODERATE as const,
    title,
    description: `desc ${title}`,
  })

  it('still collapses to primary when expandedGroups is empty (default)', () => {
    const address = faker.finance.ethereumAddress()
    const input: RecipientAnalysisResults = {
      [address]: {
        [StatusGroup.THREAT]: [
          threat('a', Severity.WARN),
          threat('b', Severity.WARN),
          threat('c', Severity.INFO),
        ] as ThreatAnalysisResult[],
      },
    }
    const result = mapVisibleAnalysisResults(input)
    expect(result.map((r) => r.title)).toEqual(['a'])
  })

  it('returns all sorted items for listed groups', () => {
    const address = faker.finance.ethereumAddress()
    const input: RecipientAnalysisResults = {
      [address]: {
        [StatusGroup.THREAT]: [threat('low', Severity.INFO), threat('high', Severity.WARN)] as ThreatAnalysisResult[],
      },
    }
    const result = mapVisibleAnalysisResults(input, [StatusGroup.THREAT])
    expect(result.map((r) => r.title)).toEqual(['high', 'low'])
  })

  it('expands only the listed groups; unlisted ones still collapse to primary', () => {
    const address = faker.finance.ethereumAddress()
    const input: RecipientAnalysisResults = {
      [address]: {
        [StatusGroup.THREAT]: [threat('t1', Severity.WARN), threat('t2', Severity.WARN)] as ThreatAnalysisResult[],
        [StatusGroup.CUSTOM_CHECKS]: [
          threat('c1', Severity.WARN),
          threat('c2', Severity.WARN),
        ] as ThreatAnalysisResult[],
      },
    }
    const result = mapVisibleAnalysisResults(input, [StatusGroup.THREAT])
    const titles = result.map((r) => r.title).sort()
    expect(titles).toEqual(['c1', 't1', 't2'])
  })
})
