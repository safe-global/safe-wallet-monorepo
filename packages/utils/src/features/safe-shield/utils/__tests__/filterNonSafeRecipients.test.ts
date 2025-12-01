import { filterNonSafeRecipients } from '../filterNonSafeRecipients'
import { CommonSharedStatus, Severity, StatusGroup } from '../../types'
import type { RecipientAnalysisResults } from '../../types'
import { getAddress } from 'ethers'
import { faker } from '@faker-js/faker'
import { RecipientAnalysisResultBuilder } from '../../builders'

describe('filterNonSafeRecipients', () => {
  const address1Checksum = getAddress(faker.finance.ethereumAddress())
  const address2Checksum = getAddress(faker.finance.ethereumAddress())
  const address3Checksum = getAddress(faker.finance.ethereumAddress())
  const address4Checksum = getAddress(faker.finance.ethereumAddress())

  it('should return empty array when analysisByAddress is undefined', () => {
    const result = filterNonSafeRecipients(undefined)
    expect(result).toEqual([])
  })

  it('should include addresses where isSafe is false', () => {
    const analysisByAddress: RecipientAnalysisResults = {
      [address1Checksum]: { isSafe: false },
    }

    const result = filterNonSafeRecipients(analysisByAddress)
    expect(result).toEqual([address1Checksum])
  })

  it('should include addresses where isSafe is undefined', () => {
    const analysisByAddress: RecipientAnalysisResults = {
      [address1Checksum]: {},
    }

    const result = filterNonSafeRecipients(analysisByAddress)
    expect(result).toEqual([address1Checksum])
  })

  it('should exclude addresses where isSafe is true', () => {
    const analysisByAddress: RecipientAnalysisResults = {
      [address1Checksum]: { isSafe: true },
      [address2Checksum]: { isSafe: false },
    }

    const result = filterNonSafeRecipients(analysisByAddress)
    expect(result).toEqual([address2Checksum])
  })

  it('should exclude addresses that have RECIPIENT_ACTIVITY results', () => {
    const analysisByAddress: RecipientAnalysisResults = {
      [address1Checksum]: {
        isSafe: false,
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
      },
      [address2Checksum]: { isSafe: false },
    }

    const result = filterNonSafeRecipients(analysisByAddress)
    expect(result).toEqual([address2Checksum])
  })

  it('should exclude addresses that have FAILED status in RECIPIENT_ACTIVITY', () => {
    const analysisByAddress: RecipientAnalysisResults = {
      [address1Checksum]: {
        isSafe: false,
        [StatusGroup.RECIPIENT_ACTIVITY]: [
          {
            severity: Severity.CRITICAL,
            type: CommonSharedStatus.FAILED,
            title: 'Activity check failed',
            description: 'Failed to check activity',
          },
        ],
      },
      [address2Checksum]: { isSafe: false },
    }

    const result = filterNonSafeRecipients(analysisByAddress)
    expect(result).toEqual([address2Checksum])
  })

  it('should include non-Safe addresses without RECIPIENT_ACTIVITY results', () => {
    const analysisByAddress: RecipientAnalysisResults = {
      [address1Checksum]: {
        isSafe: false,
        [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
      },
      [address2Checksum]: {
        isSafe: false,
        [StatusGroup.BRIDGE]: [
          {
            severity: Severity.WARN,
            type: CommonSharedStatus.FAILED,
            title: 'Bridge check failed',
            description: 'Failed to check bridge',
          },
        ],
      },
    }

    const result = filterNonSafeRecipients(analysisByAddress)
    expect(result).toEqual([address1Checksum, address2Checksum])
  })

  it('should handle mixed scenarios correctly', () => {
    const analysisByAddress: RecipientAnalysisResults = {
      [address1Checksum]: { isSafe: true }, // Safe - exclude
      [address2Checksum]: {
        isSafe: false,
        [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
      }, // Has activity - exclude
      [address3Checksum]: { isSafe: false }, // Non-Safe without activity - include
      [address4Checksum]: {}, // isSafe undefined, no activity - include
    }

    const result = filterNonSafeRecipients(analysisByAddress)
    expect(result).toEqual([address3Checksum, address4Checksum])
  })

  it('should only return addresses present in analysisByAddress', () => {
    const analysisByAddress: RecipientAnalysisResults = {
      [address1Checksum]: { isSafe: false },
    }

    const result = filterNonSafeRecipients(analysisByAddress)
    expect(result).toEqual([address1Checksum])
  })
})
