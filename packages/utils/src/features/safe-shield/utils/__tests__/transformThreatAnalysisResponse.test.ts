import type { ThreatAnalysisResponseDto } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'
import { transformThreatAnalysisResponse } from '../transformThreatAnalysisResponse'
import { Severity, ThreatStatus } from '../../types'

describe('transformThreatAnalysisResponse', () => {
  it('should return undefined when response is undefined', () => {
    const result = transformThreatAnalysisResponse(undefined)
    expect(result).toBeUndefined()
  })

  it('should transform response without extracting addresses when issues have no addresses', () => {
    const response: ThreatAnalysisResponseDto = {
      THREAT: [
        {
          severity: Severity.CRITICAL,
          type: ThreatStatus.MALICIOUS,
          title: 'Malicious activity detected',
          description: 'This is a malicious transaction',
          issues: {
            [Severity.CRITICAL]: [{ description: 'Issue 1' }, { description: 'Issue 2' }],
          },
        },
      ],
    }

    const result = transformThreatAnalysisResponse(response)

    expect(result).toEqual({
      THREAT: [
        {
          severity: Severity.CRITICAL,
          type: ThreatStatus.MALICIOUS,
          title: 'Malicious activity detected',
          description: 'This is a malicious transaction',
          issues: {
            [Severity.CRITICAL]: [{ description: 'Issue 1' }, { description: 'Issue 2' }],
          },
        },
      ],
    })
  })

  it('should extract addresses from issues and add them to addresses array', () => {
    const response: ThreatAnalysisResponseDto = {
      THREAT: [
        {
          severity: Severity.CRITICAL,
          type: ThreatStatus.MALICIOUS,
          title: 'Malicious activity detected',
          description: 'This is a malicious transaction',
          issues: {
            [Severity.CRITICAL]: [
              { description: 'Issue 1', address: '0x1234567890123456789012345678901234567890' },
              { description: 'Issue 2', address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' },
            ],
            [Severity.WARN]: [{ description: 'Issue 3', address: '0x9999999999999999999999999999999999999999' }],
          },
        },
      ],
    }

    const result = transformThreatAnalysisResponse(response)

    expect(result).toEqual({
      THREAT: [
        {
          severity: Severity.CRITICAL,
          type: ThreatStatus.MALICIOUS,
          title: 'Malicious activity detected',
          description: 'This is a malicious transaction',
          issues: {
            [Severity.CRITICAL]: [
              { description: 'Issue 1', address: '0x1234567890123456789012345678901234567890' },
              { description: 'Issue 2', address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' },
            ],
            [Severity.WARN]: [{ description: 'Issue 3', address: '0x9999999999999999999999999999999999999999' }],
          },
          addresses: [
            { address: '0x1234567890123456789012345678901234567890' },
            { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' },
            { address: '0x9999999999999999999999999999999999999999' },
          ],
        },
      ],
    })
  })

  it('should not duplicate addresses that already exist in addresses array', () => {
    const response: ThreatAnalysisResponseDto = {
      THREAT: [
        {
          severity: Severity.CRITICAL,
          type: ThreatStatus.MALICIOUS,
          title: 'Malicious activity detected',
          description: 'This is a malicious transaction',
          // @ts-expect-error - addresses field is added by transformation but not in DTO type
          addresses: [{ address: '0x1234567890123456789012345678901234567890' }],
          issues: {
            [Severity.CRITICAL]: [{ description: 'Issue 1', address: '0x1234567890123456789012345678901234567890' }],
          },
        },
      ],
    }

    const result = transformThreatAnalysisResponse(response)

    expect(result).toEqual({
      THREAT: [
        {
          severity: Severity.CRITICAL,
          type: ThreatStatus.MALICIOUS,
          title: 'Malicious activity detected',
          description: 'This is a malicious transaction',
          addresses: [{ address: '0x1234567890123456789012345678901234567890' }],
          issues: {
            [Severity.CRITICAL]: [{ description: 'Issue 1', address: '0x1234567890123456789012345678901234567890' }],
          },
        },
      ],
    })
  })

  it('should avoid duplicate addresses extracted from issues', () => {
    const response: ThreatAnalysisResponseDto = {
      THREAT: [
        {
          severity: Severity.CRITICAL,
          type: ThreatStatus.MALICIOUS,
          title: 'Malicious activity detected',
          description: 'This is a malicious transaction',
          issues: {
            [Severity.CRITICAL]: [
              { description: 'Issue 1', address: '0x1234567890123456789012345678901234567890' },
              { description: 'Issue 2', address: '0x1234567890123456789012345678901234567890' },
            ],
          },
        },
      ],
    }

    const result = transformThreatAnalysisResponse(response)

    expect(result).toEqual({
      THREAT: [
        {
          severity: Severity.CRITICAL,
          type: ThreatStatus.MALICIOUS,
          title: 'Malicious activity detected',
          description: 'This is a malicious transaction',
          issues: {
            [Severity.CRITICAL]: [
              { description: 'Issue 1', address: '0x1234567890123456789012345678901234567890' },
              { description: 'Issue 2', address: '0x1234567890123456789012345678901234567890' },
            ],
          },
          addresses: [{ address: '0x1234567890123456789012345678901234567890' }],
        },
      ],
    })
  })

  it('should handle issues without addresses mixed with issues with addresses', () => {
    const response: ThreatAnalysisResponseDto = {
      THREAT: [
        {
          severity: Severity.WARN,
          type: ThreatStatus.MODERATE,
          title: 'Moderate threat detected',
          description: 'This is a moderate threat',
          issues: {
            [Severity.WARN]: [
              { description: 'Issue without address' },
              { description: 'Issue with address', address: '0x1234567890123456789012345678901234567890' },
              { description: 'Another issue without address' },
            ],
          },
        },
      ],
    }

    const result = transformThreatAnalysisResponse(response)

    expect(result).toEqual({
      THREAT: [
        {
          severity: Severity.WARN,
          type: ThreatStatus.MODERATE,
          title: 'Moderate threat detected',
          description: 'This is a moderate threat',
          issues: {
            [Severity.WARN]: [
              { description: 'Issue without address' },
              { description: 'Issue with address', address: '0x1234567890123456789012345678901234567890' },
              { description: 'Another issue without address' },
            ],
          },
          addresses: [{ address: '0x1234567890123456789012345678901234567890' }],
        },
      ],
    })
  })

  it('should include balance changes in the result', () => {
    const response: ThreatAnalysisResponseDto = {
      THREAT: [
        {
          severity: Severity.INFO,
          type: ThreatStatus.NO_THREAT,
          title: 'No threat detected',
          description: 'Transaction is safe',
        },
      ],
      BALANCE_CHANGE: [
        {
          asset: { symbol: 'ETH', type: 'NATIVE' },
          in: [],
          out: [{ value: '1000000000000000000' }],
        },
      ],
    }

    const result = transformThreatAnalysisResponse(response)

    expect(result).toEqual({
      THREAT: [
        {
          severity: Severity.INFO,
          type: ThreatStatus.NO_THREAT,
          title: 'No threat detected',
          description: 'Transaction is safe',
        },
      ],
      BALANCE_CHANGE: [
        {
          asset: { symbol: 'ETH', type: 'NATIVE' },
          in: [],
          out: [{ value: '1000000000000000000' }],
        },
      ],
    })
  })

  it('should handle empty THREAT array', () => {
    const response: ThreatAnalysisResponseDto = {
      THREAT: [],
    }

    const result = transformThreatAnalysisResponse(response)

    expect(result).toEqual({})
  })

  it('should handle response with no THREAT property', () => {
    const response: ThreatAnalysisResponseDto = {
      BALANCE_CHANGE: [
        {
          asset: { symbol: 'ETH', type: 'NATIVE' },
          in: [],
          out: [{ value: '1000000000000000000' }],
        },
      ],
    }

    const result = transformThreatAnalysisResponse(response)

    expect(result).toEqual({
      BALANCE_CHANGE: [
        {
          asset: { symbol: 'ETH', type: 'NATIVE' },
          in: [],
          out: [{ value: '1000000000000000000' }],
        },
      ],
    })
  })
})
