import { mapConsolidatedAnalysisResults } from '../mapConsolidatedAnalysisResults'
import { Severity, StatusGroup, RecipientStatus, ContractStatus } from '../../types'
import type { GroupedAnalysisResults, RecipientAnalysisResults, ContractAnalysisResults } from '../../types'
import { RecipientAnalysisResultBuilder, ContractAnalysisResultBuilder } from '../../builders'
import { faker } from '@faker-js/faker'

describe('mapConsolidatedAnalysisResults', () => {
  it('should consolidate results from multiple addresses', () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()

    const addressesResultsMap: RecipientAnalysisResults = {
      [address1]: {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
      },
      [address2]: {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.unknownRecipient().build()],
      },
    }

    const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)

    const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

    expect(result.length).toBe(1)
    expect(result[0].severity).toBe(Severity.INFO)
    expect(result[0].type).toBe(RecipientStatus.UNKNOWN_RECIPIENT)
  })

  it('should return a multi-recipient description with "all" when all recipients match', () => {
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

    const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)

    const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe(RecipientStatus.KNOWN_RECIPIENT)
    expect(result[0].severity).toBe(Severity.OK)
    expect(result[0].description).toContain('All these addresses are in your address book or a Safe you own.')
  })

  it('should return a multi-recipient description with the correct number of recipients when some recipients match', () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()
    const address3 = faker.finance.ethereumAddress()

    const addressesResultsMap: RecipientAnalysisResults = {
      [address1]: {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.unknownRecipient().build()],
      },
      [address2]: {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
      },
      [address3]: {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.unknownRecipient().build()],
      },
    }

    const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)

    const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

    expect(result).toHaveLength(1)
    expect(result[0].severity).toBe(Severity.INFO)
    expect(result[0].type).toBe(RecipientStatus.UNKNOWN_RECIPIENT)
    expect(result[0].description).toContain('2 addresses are not in your address book or a Safe you own.')
  })

  it('should handle multiple groups per address and return the primary result from each group', () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()
    const address3 = faker.finance.ethereumAddress()
    const address4 = faker.finance.ethereumAddress()

    const addressesResultsMap: RecipientAnalysisResults = {
      [address1]: {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
      },
      [address2]: {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.unknownRecipient().build()],
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
      },
      [address3]: {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
      },
      [address4]: {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
      },
    }

    const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)

    const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

    expect(result).toHaveLength(2)
    expect(result[0].severity).toBe(Severity.WARN)
    expect(result[0].type).toBe(RecipientStatus.LOW_ACTIVITY)
    expect(result[0].description).toContain('3 addresses have few transactions.')
    expect(result[1].severity).toBe(Severity.INFO)
    expect(result[1].type).toBe(RecipientStatus.UNKNOWN_RECIPIENT)
    expect(result[1].description).toContain('1 address is not in your address book or a Safe you own.')
  })

  it('should select primary result from each group', () => {
    const address1 = faker.finance.ethereumAddress()

    const addressesResultsMap: RecipientAnalysisResults = {
      [address1]: {
        [StatusGroup.ADDRESS_BOOK]: [
          RecipientAnalysisResultBuilder.knownRecipient().build(),
          RecipientAnalysisResultBuilder.unknownRecipient().build(),
        ],
      },
    }

    const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)

    const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

    expect(result).toHaveLength(1)
    expect(result[0].severity).toBe(Severity.INFO)
    expect(result[0].title).toBe('Unknown recipient')
  })

  it('should sort consolidated results by severity', () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()

    const addressesResultsMap: RecipientAnalysisResults = {
      [address1]: {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
        [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.recurringRecipient().build()],
      },
      [address2]: {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.unknownRecipient().build()],
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
        [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.recurringRecipient().build()],
      },
    }

    const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)

    const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

    expect(result).toHaveLength(3)
    expect(result[0].severity).toBe(Severity.WARN)
    expect(result[1].severity).toBe(Severity.INFO)
    expect(result[2].severity).toBe(Severity.OK)
  })

  it('should return empty array for empty input', () => {
    const addressesResultsMap: RecipientAnalysisResults = {}
    const addressResults: GroupedAnalysisResults[] = []

    const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

    expect(result).toEqual([])
  })

  it('should return empty array for addresses with no results', () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()
    const address3 = faker.finance.ethereumAddress()

    const addressesResultsMap: RecipientAnalysisResults = {
      [address1]: {},
      [address2]: {},
      [address3]: {},
    }

    const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)

    const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

    expect(result).toEqual([])
  })

  it('should handle addresses with empty groups', () => {
    const address1 = faker.finance.ethereumAddress()

    const addressesResultsMap: RecipientAnalysisResults = {
      [address1]: {
        [StatusGroup.ADDRESS_BOOK]: [],
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
      },
    }

    const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)

    const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe(RecipientStatus.LOW_ACTIVITY)
  })

  it('should skip non-array group results when consolidating', () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()

    const addressesResultsMap: RecipientAnalysisResults = {
      [address1]: {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        [StatusGroup.RECIPIENT_ACTIVITY]: null as any, // Non-array value
      },
      [address2]: {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.unknownRecipient().build()],
        [StatusGroup.RECIPIENT_ACTIVITY]: {} as any, // Non-array value
      },
    }

    const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)

    const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

    expect(result).toHaveLength(1)
    expect(result[0].severity).toBe(Severity.INFO)
    expect(result[0].type).toBe(RecipientStatus.UNKNOWN_RECIPIENT)
  })

  it('should handle mixed array and non-array group results', () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()
    const address3 = faker.finance.ethereumAddress()

    const addressesResultsMap: RecipientAnalysisResults = {
      [address1]: {
        [StatusGroup.ADDRESS_BOOK]: undefined as any, // Non-array value
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
      },
      [address2]: {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        [StatusGroup.RECIPIENT_ACTIVITY]: 'invalid' as any, // Non-array value
      },
      [address3]: {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.unknownRecipient().build()],
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
      },
    }

    const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)

    const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

    expect(result).toHaveLength(2)
    expect(result[0].severity).toBe(Severity.WARN)
    expect(result[0].type).toBe(RecipientStatus.LOW_ACTIVITY)
    expect(result[0].description).toContain('2 addresses have few transactions.')
    expect(result[1].severity).toBe(Severity.INFO)
    expect(result[1].type).toBe(RecipientStatus.UNKNOWN_RECIPIENT)
  })

  it('should return empty array when all group results are non-array', () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()

    const addressesResultsMap: RecipientAnalysisResults = {
      [address1]: {
        [StatusGroup.ADDRESS_BOOK]: null as any,
        [StatusGroup.RECIPIENT_ACTIVITY]: {} as any,
      },
      [address2]: {
        [StatusGroup.ADDRESS_BOOK]: undefined as any,
        [StatusGroup.RECIPIENT_ACTIVITY]: 'invalid' as any,
      },
    }

    const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)

    const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

    expect(result).toEqual([])
  })

  describe('UNOFFICIAL_FALLBACK_HANDLER', () => {
    it('should show only fallback handler addresses, not contract addresses', () => {
      const contractAddress1 = faker.finance.ethereumAddress()
      const contractAddress2 = faker.finance.ethereumAddress()
      const fallbackHandlerAddress1 = faker.finance.ethereumAddress()
      const fallbackHandlerAddress2 = faker.finance.ethereumAddress()
      const handlerName1 = faker.company.name()
      const handlerName2 = faker.company.name()

      const addressesResultsMap: ContractAnalysisResults = {
        [contractAddress1]: {
          [StatusGroup.FALLBACK_HANDLER]: [
            ContractAnalysisResultBuilder.unofficialFallbackHandler({
              address: fallbackHandlerAddress1,
              name: handlerName1,
            }).build(),
          ],
        },
        [contractAddress2]: {
          [StatusGroup.FALLBACK_HANDLER]: [
            ContractAnalysisResultBuilder.unofficialFallbackHandler({
              address: fallbackHandlerAddress2,
              name: handlerName2,
            }).build(),
          ],
        },
      }

      const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)
      const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

      expect(result).toHaveLength(1)
      expect(result[0].type).toBe(ContractStatus.UNOFFICIAL_FALLBACK_HANDLER)
      expect(result[0].addresses).toHaveLength(2)

      expect(result[0].addresses?.[0].address).toBe(fallbackHandlerAddress1)
      expect(result[0].addresses?.[0].name).toBe(handlerName1)
      expect(result[0].addresses?.[1].address).toBe(fallbackHandlerAddress2)
      expect(result[0].addresses?.[1].name).toBe(handlerName2)

      expect(result[0].addresses?.some((addr) => addr.address === contractAddress1)).toBe(false)
      expect(result[0].addresses?.some((addr) => addr.address === contractAddress2)).toBe(false)
    })

    it('should handle fallback handler without optional name/logoUrl', () => {
      const contractAddress = faker.finance.ethereumAddress()
      const fallbackHandlerAddress = faker.finance.ethereumAddress()

      const addressesResultsMap: ContractAnalysisResults = {
        [contractAddress]: {
          [StatusGroup.FALLBACK_HANDLER]: [
            ContractAnalysisResultBuilder.unofficialFallbackHandler({
              address: fallbackHandlerAddress,
            }).build(),
          ],
        },
      }

      const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)
      const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

      expect(result).toHaveLength(1)
      expect(result[0].addresses).toHaveLength(1)

      expect(result[0].addresses?.[0].address).toBe(fallbackHandlerAddress)
      expect(result[0].addresses?.[0].name).toBeUndefined()
      expect(result[0].addresses?.[0].logoUrl).toBeUndefined()
    })

    it('should generate singular description for one fallback handler', () => {
      const contractAddress = faker.finance.ethereumAddress()
      const fallbackHandlerAddress = faker.finance.ethereumAddress()

      const addressesResultsMap: ContractAnalysisResults = {
        [contractAddress]: {
          [StatusGroup.FALLBACK_HANDLER]: [
            ContractAnalysisResultBuilder.unofficialFallbackHandler({
              address: fallbackHandlerAddress,
            }).build(),
          ],
        },
      }

      const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)

      const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

      expect(result).toHaveLength(1)
      expect(result[0].description).toBe('Verify this fallback handler is trusted and secure before proceeding.')
    })

    it('should generate plural description for multiple fallback handlers', () => {
      const contractAddress1 = faker.finance.ethereumAddress()
      const contractAddress2 = faker.finance.ethereumAddress()
      const contractAddress3 = faker.finance.ethereumAddress()
      const fallbackHandlerAddress1 = faker.finance.ethereumAddress()
      const fallbackHandlerAddress2 = faker.finance.ethereumAddress()
      const fallbackHandlerAddress3 = faker.finance.ethereumAddress()

      const addressesResultsMap: ContractAnalysisResults = {
        [contractAddress1]: {
          [StatusGroup.FALLBACK_HANDLER]: [
            ContractAnalysisResultBuilder.unofficialFallbackHandler({
              address: fallbackHandlerAddress1,
            }).build(),
          ],
        },
        [contractAddress2]: {
          [StatusGroup.FALLBACK_HANDLER]: [
            ContractAnalysisResultBuilder.unofficialFallbackHandler({
              address: fallbackHandlerAddress2,
            }).build(),
          ],
        },
        [contractAddress3]: {
          [StatusGroup.FALLBACK_HANDLER]: [
            ContractAnalysisResultBuilder.unofficialFallbackHandler({
              address: fallbackHandlerAddress3,
            }).build(),
          ],
        },
      }

      const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)
      const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

      expect(result).toHaveLength(1)
      expect(result[0].description).toBe('Verify all fallback handlers are trusted and secure before proceeding.')
    })

    it('should not affect other contract status types - they should still use contract addresses', () => {
      const contractAddress1 = faker.finance.ethereumAddress()
      const contractAddress2 = faker.finance.ethereumAddress()
      const fallbackHandlerAddress = faker.finance.ethereumAddress()
      const contractName1 = faker.company.name()
      const contractName2 = faker.company.name()
      const handlerName = faker.company.name()

      const addressesResultsMap: ContractAnalysisResults = {
        [contractAddress1]: {
          name: contractName1,
          [StatusGroup.CONTRACT_VERIFICATION]: [ContractAnalysisResultBuilder.unverified().build()],
        },
        [contractAddress2]: {
          name: contractName2,
          [StatusGroup.FALLBACK_HANDLER]: [
            ContractAnalysisResultBuilder.unofficialFallbackHandler({
              address: fallbackHandlerAddress,
              name: handlerName,
            }).build(),
          ],
        },
      }

      const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)
      const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

      expect(result).toHaveLength(2)

      const unverifiedResult = result.find((r) => r.type === ContractStatus.NOT_VERIFIED)
      const fallbackHandlerResult = result.find((r) => r.type === ContractStatus.UNOFFICIAL_FALLBACK_HANDLER)

      // Unverified contract
      expect(unverifiedResult?.addresses).toHaveLength(1)
      expect(unverifiedResult?.addresses?.[0].address).toBe(contractAddress1)
      expect(unverifiedResult?.addresses?.[0].name).toBe(contractName1)

      // Fallback handler
      expect(fallbackHandlerResult?.addresses).toHaveLength(1)
      expect(fallbackHandlerResult?.addresses?.[0].address).toBe(fallbackHandlerAddress)
      expect(fallbackHandlerResult?.addresses?.[0].name).toBe(handlerName)
    })

    it('should handle mixed fallback handlers with and without names', () => {
      const contractAddress1 = faker.finance.ethereumAddress()
      const contractAddress2 = faker.finance.ethereumAddress()
      const fallbackHandlerAddress1 = faker.finance.ethereumAddress()
      const fallbackHandlerAddress2 = faker.finance.ethereumAddress()
      const handlerName = faker.company.name()
      const logoUrl = faker.image.url()

      const addressesResultsMap: ContractAnalysisResults = {
        [contractAddress1]: {
          [StatusGroup.FALLBACK_HANDLER]: [
            ContractAnalysisResultBuilder.unofficialFallbackHandler({
              address: fallbackHandlerAddress1,
              name: handlerName,
              logoUrl: logoUrl,
            }).build(),
          ],
        },
        [contractAddress2]: {
          [StatusGroup.FALLBACK_HANDLER]: [
            ContractAnalysisResultBuilder.unofficialFallbackHandler({
              address: fallbackHandlerAddress2,
            }).build(),
          ],
        },
      }

      const addressResults: GroupedAnalysisResults[] = Object.values(addressesResultsMap)
      const result = mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)

      expect(result).toHaveLength(1)
      expect(result[0].addresses).toHaveLength(2)
      expect(result[0].addresses?.[0]).toEqual({
        address: fallbackHandlerAddress1,
        name: handlerName,
        logoUrl: logoUrl,
      })
      expect(result[0].addresses?.[1]).toEqual({
        address: fallbackHandlerAddress2,
        name: undefined,
        logoUrl: undefined,
      })
    })
  })
})
