import { mapConsolidatedAnalysisResults } from '../mapConsolidatedAnalysisResults'
import { Severity, StatusGroup, RecipientStatus } from '../../types'
import type { AddressAnalysisResults } from '../../types'
import { RecipientAnalysisResultBuilder } from '../../builders'

describe('mapConsolidatedAnalysisResults', () => {
  it('should consolidate results from multiple addresses', () => {
    const addressResults: AddressAnalysisResults[] = [
      {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
      },
      {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.unknownRecipient().build()],
      },
    ]

    const result = mapConsolidatedAnalysisResults(addressResults)

    expect(result.length).toBe(1)
    expect(result[0].severity).toBe(Severity.INFO)
    expect(result[0].type).toBe(RecipientStatus.UNKNOWN_RECIPIENT)
  })

  it('should return a multi-recipient description with "all" when all recipients match', () => {
    const addressResults: AddressAnalysisResults[] = [
      {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
      },
      {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
      },
    ]

    const result = mapConsolidatedAnalysisResults(addressResults)

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe(RecipientStatus.KNOWN_RECIPIENT)
    expect(result[0].severity).toBe(Severity.OK)
    expect(result[0].description).toContain('All these addresses are in your address book or a Safe you own.')
  })

  it('should return a multi-recipient description with the correct number of recipients when some recipients match', () => {
    const addressResults: AddressAnalysisResults[] = [
      {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.unknownRecipient().build()],
      },
      {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
      },
      {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.unknownRecipient().build()],
      },
    ]

    const result = mapConsolidatedAnalysisResults(addressResults)

    expect(result).toHaveLength(1)
    expect(result[0].severity).toBe(Severity.INFO)
    expect(result[0].type).toBe(RecipientStatus.UNKNOWN_RECIPIENT)
    expect(result[0].description).toContain('2 addresses are not in your address book or a Safe you own.')
  })

  it('should handle multiple groups per address and return the primary result from each group', () => {
    const addressResults: AddressAnalysisResults[] = [
      {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
      },
      {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.unknownRecipient().build()],
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.highActivity().build()],
      },
      {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.highActivity().build()],
      },
      {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
      },
    ]

    const result = mapConsolidatedAnalysisResults(addressResults)

    expect(result).toHaveLength(2)
    expect(result[0].severity).toBe(Severity.WARN)
    expect(result[0].type).toBe(RecipientStatus.LOW_ACTIVITY)
    expect(result[0].description).toContain('2 addresses have low activity.')
    expect(result[1].severity).toBe(Severity.INFO)
    expect(result[1].type).toBe(RecipientStatus.UNKNOWN_RECIPIENT)
    expect(result[1].description).toContain('1 address is not in your address book or a Safe you own.')
  })

  it('should select primary result from each group', () => {
    const addressResults: AddressAnalysisResults[] = [
      {
        [StatusGroup.ADDRESS_BOOK]: [
          RecipientAnalysisResultBuilder.knownRecipient().build(),
          RecipientAnalysisResultBuilder.unknownRecipient().build(),
        ],
      },
    ]

    const result = mapConsolidatedAnalysisResults(addressResults)

    expect(result).toHaveLength(1)
    expect(result[0].severity).toBe(Severity.INFO)
    expect(result[0].title).toBe('Unknown recipient')
  })

  it('should sort consolidated results by severity', () => {
    const addressResults: AddressAnalysisResults[] = [
      {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
        [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
      },
      {
        [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.highActivity().build()],
        [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.recurringRecipient().build()],
      },
    ]

    const result = mapConsolidatedAnalysisResults(addressResults)

    expect(result).toHaveLength(3)
    expect(result[0].severity).toBe(Severity.WARN)
    expect(result[1].severity).toBe(Severity.INFO)
    expect(result[2].severity).toBe(Severity.OK)
  })

  it('should return empty array for empty input', () => {
    const result = mapConsolidatedAnalysisResults([])

    expect(result).toEqual([])
  })

  it('should return empty array for addresses with no results', () => {
    const addressResults: AddressAnalysisResults[] = [{}, {}, {}]

    const result = mapConsolidatedAnalysisResults(addressResults)

    expect(result).toEqual([])
  })

  it('should handle addresses with empty groups', () => {
    const addressResults: AddressAnalysisResults[] = [
      {
        [StatusGroup.ADDRESS_BOOK]: [],
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
      },
    ]

    const result = mapConsolidatedAnalysisResults(addressResults)

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe(RecipientStatus.LOW_ACTIVITY)
  })
})
