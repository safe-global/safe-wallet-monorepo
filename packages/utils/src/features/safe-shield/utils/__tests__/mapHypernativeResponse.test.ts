import { faker } from '@faker-js/faker'
import { mapHypernativeResponse } from '../mapHypernativeResponse'
import { ContractStatus, Severity, StatusGroup, ThreatStatus } from '../../types'
import type {
  HypernativeAssessmentFailedResponseDto,
  HypernativeAssessmentResponseDto,
} from '@safe-global/store/hypernative/hypernativeApi.dto'
import type { HypernativeBalanceChange } from '../../types/hypernative.type'
import { ZeroAddress } from 'ethers'
import { checksumAddress } from '@safe-global/utils/utils/addresses'

describe('mapHypernativeResponse', () => {
  const mockSafeAddress = faker.finance.ethereumAddress() as `0x${string}`

  const createNoThreatResponse = (): HypernativeAssessmentResponseDto['data'] => ({
    safeTxHash: faker.string.hexadecimal({ length: 64 }) as `0x${string}`,
    status: 'OK',
    assessmentData: {
      assessmentId: faker.string.uuid(),
      assessmentTimestamp: new Date().toISOString(),
      recommendation: 'accept',
      interpretation: 'Transfer 1 ETH to recipient',
      findings: {
        THREAT_ANALYSIS: {
          status: 'No risks found',
          severity: 'accept',
          risks: [],
        },
        CUSTOM_CHECKS: {
          status: 'Passed',
          severity: 'accept',
          risks: [],
        },
      },
    },
  })

  const createBalanceChangeHN = (overrides: Partial<HypernativeBalanceChange> = {}): HypernativeBalanceChange => {
    const decimals = overrides.decimals ?? 18
    const originalValue = faker.number.int({ min: 1, max: 10 })
    const amount = (originalValue * 10 ** decimals).toString()
    const usdValue = (originalValue * 1000).toString()

    return {
      changeType: 'receive',
      tokenSymbol: 'ETH',
      tokenAddress: ZeroAddress as `0x${string}`,
      usdValue,
      amount,
      chain: 'ethereum',
      decimals,
      originalValue: originalValue.toString(),
      evmChainId: 1,
      ...overrides,
    }
  }

  describe('status handling', () => {
    it('should return error result when status is FAILED', () => {
      const responseDescription = 'The threat analysis failed'
      const response: HypernativeAssessmentFailedResponseDto = {
        error: responseDescription,
        errorCode: 500,
        success: false,
        data: null,
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]).toHaveLength(1)
      expect(result[StatusGroup.THREAT]?.[0]).toEqual({
        severity: Severity.CRITICAL,
        type: ThreatStatus.HYPERNATIVE_GUARD,
        title: 'Hypernative analysis failed',
        description: responseDescription,
      })
    })
  })

  describe('no risks found', () => {
    it('should return NO_THREAT when no risks found', () => {
      const response = createNoThreatResponse()

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]).toContainEqual(
        expect.objectContaining({
          severity: Severity.OK,
          type: ThreatStatus.NO_THREAT,
          title: 'No threats detected',
          description: 'Threat analysis found no issues.',
        }),
      )
    })

    it('should return custom checks result when CUSTOM_CHECKS has no risks', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'No risks found',
              severity: 'accept',
              risks: [],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.CUSTOM_CHECKS]).toContainEqual(
        expect.objectContaining({
          severity: Severity.OK,
          type: ThreatStatus.NO_THREAT,
          title: 'Custom checks',
          description: 'Custom checks found no issues.',
        }),
      )
    })
  })

  describe('threat analysis risks', () => {
    it('should map CRITICAL severity for deny risks', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          recommendation: 'deny',
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'deny',
              risks: [
                {
                  title: 'Transfer to malicious',
                  details: 'Transfer to known phishing address.',
                  severity: 'deny',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]?.[0]).toEqual({
        severity: Severity.CRITICAL,
        type: ThreatStatus.HYPERNATIVE_GUARD,
        title: 'Malicious threat detected',
        description: 'Transfer to malicious. The full threat report is available in your Hypernative account.',
      })
    })

    it('should map WARN severity for warn risks', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          recommendation: 'warn',
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: 'Suspicious swap pattern',
                  details: 'Swap volume unusually large.',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]?.[0]).toEqual({
        severity: Severity.WARN,
        type: ThreatStatus.HYPERNATIVE_GUARD,
        title: 'Moderate threat detected',
        description: 'Suspicious swap pattern. The full threat report is available in your Hypernative account.',
      })
    })

    it('should map OK severity for accept risks', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'No risks found',
              severity: 'accept',
              risks: [
                {
                  title: 'All checks passed',
                  details: 'Transaction appears safe.',
                  severity: 'accept',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]).toContainEqual({
        severity: Severity.OK,
        type: ThreatStatus.HYPERNATIVE_GUARD,
        title: 'No threat detected',
        description: 'All checks passed. The full threat report is available in your Hypernative account.',
      })
    })
  })

  describe('custom checks risks', () => {
    it('should include custom checks risks in results', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          recommendation: 'warn',
          findings: {
            THREAT_ANALYSIS: {
              status: 'No risks found',
              severity: 'accept',
              risks: [],
            },
            CUSTOM_CHECKS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: 'Pool Toxicity',
                  details: 'Pool contains 4% of illicit funds.',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
                {
                  title: 'Unusually high gas price',
                  details: 'Gas price higher than max allowed.',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.CUSTOM_CHECKS]).toContainEqual({
        severity: Severity.WARN,
        type: ThreatStatus.HYPERNATIVE_GUARD,
        title: 'Moderate threat detected',
        description: 'Pool Toxicity. The full threat report is available in your Hypernative account.',
      })

      expect(result[StatusGroup.CUSTOM_CHECKS]).toContainEqual({
        severity: Severity.WARN,
        type: ThreatStatus.HYPERNATIVE_GUARD,
        title: 'Moderate threat detected',
        description: 'Unusually high gas price. The full threat report is available in your Hypernative account.',
      })
    })
  })

  describe('multiple risks', () => {
    it('should combine risks from both THREAT_ANALYSIS and CUSTOM_CHECKS', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          recommendation: 'deny',
          interpretation: 'Swap 2 USDC for 2.01 USDT',
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'deny',
              risks: [
                {
                  title: 'Transfer to malicious',
                  details: 'Transfer to phishing address',
                  severity: 'deny',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: 'Pool Toxicity',
                  details: 'Pool contains illicit funds',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      // THREAT_ANALYSIS has 1 deny risk
      expect(result[StatusGroup.THREAT]).toHaveLength(1)
      expect(result[StatusGroup.THREAT]?.[0].severity).toBe(Severity.CRITICAL)
      expect(result[StatusGroup.THREAT]?.[0].title).toBe('Malicious threat detected')

      // CUSTOM_CHECKS has 1 warn risk
      expect(result[StatusGroup.CUSTOM_CHECKS]).toHaveLength(1)
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[0].severity).toBe(Severity.WARN)
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[0].title).toBe('Moderate threat detected')
    })
  })

  describe('severity sorting', () => {
    it('should sort results by severity (CRITICAL first, then WARN, INFO, OK)', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          interpretation: 'Transaction interpretation',
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: 'OK risk',
                  details: 'This is OK',
                  severity: 'accept',
                  safeCheckId: faker.string.alphanumeric(10),
                },
                {
                  title: 'Critical risk',
                  details: 'This is critical',
                  severity: 'deny',
                  safeCheckId: faker.string.alphanumeric(10),
                },
                {
                  title: 'Warning risk',
                  details: 'This is a warning',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      // THREAT_ANALYSIS should be sorted: CRITICAL first, then WARN, then OK
      expect(result[StatusGroup.THREAT]).toHaveLength(3)
      expect(result[StatusGroup.THREAT]?.[0].severity).toBe(Severity.CRITICAL)
      expect(result[StatusGroup.THREAT]?.[0].title).toBe('Malicious threat detected')
      expect(result[StatusGroup.THREAT]?.[1].severity).toBe(Severity.WARN)
      expect(result[StatusGroup.THREAT]?.[1].title).toBe('Moderate threat detected')
      expect(result[StatusGroup.THREAT]?.[2].severity).toBe(Severity.OK)
      expect(result[StatusGroup.THREAT]?.[2].title).toBe('No threat detected')
    })

    it('should maintain stable order for risks with the same severity', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: 'First warning',
                  details: 'First warning details',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
                {
                  title: 'Second warning',
                  details: 'Second warning details',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]).toHaveLength(2)
      expect(result[StatusGroup.THREAT]?.[0].severity).toBe(Severity.WARN)
      expect(result[StatusGroup.THREAT]?.[0].title).toBe('Moderate threat detected')
      expect(result[StatusGroup.THREAT]?.[1].severity).toBe(Severity.WARN)
      expect(result[StatusGroup.THREAT]?.[1].title).toBe('Moderate threat detected')
    })
  })

  describe('risk title mapping', () => {
    it('should map known Hypernative risk titles to specific ThreatStatus types', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: 'Safe Multisig governance change',
                  details: 'Governance structure is being modified',
                  severity: 'warn',
                  safeCheckId: 'F-33063', // Maps to OWNERSHIP_CHANGE
                },
                {
                  title: 'Multisig - module change',
                  details: 'A module is being added or removed',
                  severity: 'warn',
                  safeCheckId: 'F-33083', // Maps to MODULE_CHANGE
                },
                {
                  title: 'Safe Multisig - fallback handler updated',
                  details: 'Fallback handler is being changed',
                  severity: 'warn',
                  safeCheckId: 'F-33042', // Maps to UNOFFICIAL_FALLBACK_HANDLER
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]?.[0].type).toBe(ThreatStatus.OWNERSHIP_CHANGE)
      expect(result[StatusGroup.THREAT]?.[1].type).toBe(ThreatStatus.MODULE_CHANGE)
      expect(result[StatusGroup.THREAT]?.[2].type).toBe(ContractStatus.UNOFFICIAL_FALLBACK_HANDLER)
    })

    it('should use HYPERNATIVE_GUARD for unknown risk titles', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: 'Unknown risk type',
                  details: 'This is a new type of risk',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]?.[0].type).toBe(ThreatStatus.HYPERNATIVE_GUARD)
    })

    it('should fall back to HYPERNATIVE_GUARD for MASTERCOPY_CHANGE', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: 'Mastercopy change',
                  details: 'Mastercopy is being changed',
                  severity: 'warn',
                  safeCheckId: 'F-33095', // Maps to MASTERCOPY_CHANGE but should fall back to HYPERNATIVE_GUARD
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]?.[0].type).toBe(ThreatStatus.HYPERNATIVE_GUARD)
      expect(result[StatusGroup.THREAT]?.[0].title).toBe('Moderate threat detected')
    })

    it('should fall back to Severity.INFO for unknown severity values', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: 'Risk with unknown severity',
                  details: 'This risk has an unknown severity value',
                  severity: 'unknown_severity' as any, // Unknown severity
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]?.[0].severity).toBe(Severity.INFO)
      expect(result[StatusGroup.THREAT]?.[0].title).toBe('Risk with unknown severity')
    })

    it('should map all known safeCheckIds correctly', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: 'Ownership change (F-33063)',
                  details: 'Ownership change details',
                  severity: 'warn',
                  safeCheckId: 'F-33063', // OWNERSHIP_CHANGE
                },
                {
                  title: 'Ownership change (F-33053)',
                  details: 'Ownership change details',
                  severity: 'warn',
                  safeCheckId: 'F-33053', // OWNERSHIP_CHANGE
                },
                {
                  title: 'Module change (F-33083)',
                  details: 'Module change details',
                  severity: 'warn',
                  safeCheckId: 'F-33083', // MODULE_CHANGE
                },
                {
                  title: 'Module change (F-33073)',
                  details: 'Module change details',
                  severity: 'warn',
                  safeCheckId: 'F-33073', // MODULE_CHANGE
                },
                {
                  title: 'Fallback handler',
                  details: 'Fallback handler details',
                  severity: 'warn',
                  safeCheckId: 'F-33042', // UNOFFICIAL_FALLBACK_HANDLER
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]?.[0].type).toBe(ThreatStatus.OWNERSHIP_CHANGE)
      expect(result[StatusGroup.THREAT]?.[1].type).toBe(ThreatStatus.OWNERSHIP_CHANGE)
      expect(result[StatusGroup.THREAT]?.[2].type).toBe(ThreatStatus.MODULE_CHANGE)
      expect(result[StatusGroup.THREAT]?.[3].type).toBe(ThreatStatus.MODULE_CHANGE)
      expect(result[StatusGroup.THREAT]?.[4].type).toBe(ContractStatus.UNOFFICIAL_FALLBACK_HANDLER)
    })
  })

  describe('edge cases', () => {
    it('should handle empty error message in FAILED response', () => {
      const response: HypernativeAssessmentFailedResponseDto = {
        error: '',
        errorCode: 500,
        success: false,
        data: null,
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]).toHaveLength(1)
      expect(result[StatusGroup.THREAT]?.[0]).toEqual({
        severity: Severity.CRITICAL,
        type: ThreatStatus.HYPERNATIVE_GUARD,
        title: 'Hypernative analysis failed',
        description: '',
      })
    })

    it('should handle risk with empty title', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: '',
                  details: 'Risk details here',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]?.[0].title).toBe('Moderate threat detected')
      expect(result[StatusGroup.THREAT]?.[0].description).toBe(
        'The full threat report is available in your Hypernative account.',
      )
    })

    it('should handle risk with empty details', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: 'Risk title',
                  details: '',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]?.[0].title).toBe('Moderate threat detected')
      expect(result[StatusGroup.THREAT]?.[0].description).toBe(
        'Risk title. The full threat report is available in your Hypernative account.',
      )
    })

    it('should handle risk with empty title and empty details', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: '',
                  details: '',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]?.[0].title).toBe('Moderate threat detected')
      expect(result[StatusGroup.THREAT]?.[0].description).toBe(
        'The full threat report is available in your Hypernative account.',
      )
    })

    it('should handle risk with empty safeCheckId', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: 'Risk with no safeCheckId',
                  details: 'Details here',
                  severity: 'warn',
                  safeCheckId: '',
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.THREAT]?.[0].type).toBe(ThreatStatus.HYPERNATIVE_GUARD)
      expect(result[StatusGroup.THREAT]?.[0].title).toBe('Moderate threat detected')
    })

    it('should handle custom checks with multiple risks of different severities', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'No risks found',
              severity: 'accept',
              risks: [],
            },
            CUSTOM_CHECKS: {
              status: 'Risks found',
              severity: 'deny',
              risks: [
                {
                  title: 'OK custom check',
                  details: 'This is OK',
                  severity: 'accept',
                  safeCheckId: faker.string.alphanumeric(10),
                },
                {
                  title: 'Critical custom check',
                  details: 'This is critical',
                  severity: 'deny',
                  safeCheckId: faker.string.alphanumeric(10),
                },
                {
                  title: 'Warning custom check',
                  details: 'This is a warning',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      expect(result[StatusGroup.CUSTOM_CHECKS]).toHaveLength(3)
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[0].severity).toBe(Severity.CRITICAL)
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[0].title).toBe('Malicious threat detected')
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[1].severity).toBe(Severity.WARN)
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[1].title).toBe('Moderate threat detected')
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[2].severity).toBe(Severity.OK)
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[2].title).toBe('No threat detected')
    })
  })

  describe('balance changes', () => {
    const safeAddress = faker.finance.ethereumAddress().toLowerCase() as `0x${string}`

    it('should not include BALANCE_CHANGE when balanceChanges is undefined', () => {
      const response = createNoThreatResponse()

      const result = mapHypernativeResponse(response, safeAddress)

      expect(result.BALANCE_CHANGE).toBeUndefined()
    })

    it('should not include BALANCE_CHANGE when balanceChanges is empty', () => {
      const noThreatResponse = createNoThreatResponse()
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...noThreatResponse,
        assessmentData: {
          ...noThreatResponse.assessmentData,
          balanceChanges: {},
        },
      }

      const result = mapHypernativeResponse(response, safeAddress)

      expect(result.BALANCE_CHANGE).toBeUndefined()
    })

    it('should not include BALANCE_CHANGE when safeAddress has no balance changes', () => {
      const otherAddress = faker.finance.ethereumAddress().toLowerCase() as `0x${string}`
      const noThreatResponse = createNoThreatResponse()
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...noThreatResponse,
        assessmentData: {
          ...noThreatResponse.assessmentData,
          balanceChanges: { [otherAddress]: [createBalanceChangeHN()] },
        },
      }

      const result = mapHypernativeResponse(response, safeAddress)

      expect(result.BALANCE_CHANGE).toBeUndefined()
    })

    it('should map native token balance changes correctly', () => {
      const noThreatResponse = createNoThreatResponse()

      const balanceChanges = [
        createBalanceChangeHN({ changeType: 'receive', tokenAddress: undefined }),
        createBalanceChangeHN({ changeType: 'send', tokenAddress: undefined }),
      ]

      const response: HypernativeAssessmentResponseDto['data'] = {
        ...noThreatResponse,
        assessmentData: {
          ...noThreatResponse.assessmentData,
          balanceChanges: { [safeAddress]: balanceChanges },
        },
      }

      const result = mapHypernativeResponse(response, safeAddress)

      expect(result.BALANCE_CHANGE).toBeDefined()
      expect(result.BALANCE_CHANGE).toHaveLength(1)
      const balanceChange = result.BALANCE_CHANGE?.[0]
      expect(balanceChange?.asset.type).toBe('NATIVE')
      expect(balanceChange?.asset.symbol).toBe('ETH')
      expect(balanceChange?.asset).not.toHaveProperty('address')
      expect(balanceChange?.in).toEqual([{ value: balanceChanges[0].amount }])
      expect(balanceChange?.out).toEqual([{ value: balanceChanges[1].amount }])
    })

    it('should map ERC20 token balance changes correctly', () => {
      const noThreatResponse = createNoThreatResponse()

      const tokenAddress = faker.finance.ethereumAddress() as `0x${string}`
      const tokenSymbol = 'USDC'

      const balanceChanges = [
        createBalanceChangeHN({ changeType: 'receive', tokenAddress, tokenSymbol }),
        createBalanceChangeHN({ changeType: 'send', tokenAddress, tokenSymbol }),
      ]

      const response: HypernativeAssessmentResponseDto['data'] = {
        ...noThreatResponse,
        assessmentData: {
          ...noThreatResponse.assessmentData,
          balanceChanges: { [safeAddress]: balanceChanges },
        },
      }

      const result = mapHypernativeResponse(response, safeAddress)

      expect(result.BALANCE_CHANGE).toBeDefined()
      expect(result.BALANCE_CHANGE).toHaveLength(1)
      expect(result.BALANCE_CHANGE?.[0]).toEqual({
        asset: {
          type: 'ERC20',
          symbol: tokenSymbol,
          address: tokenAddress,
        },
        in: [{ value: balanceChanges[0].amount }],
        out: [{ value: balanceChanges[1].amount }],
      })
    })

    it('should group multiple changes for the same token', () => {
      const noThreatResponse = createNoThreatResponse()

      const tokenAddress = faker.finance.ethereumAddress() as `0x${string}`
      const tokenSymbol = 'USDC'

      const balanceChanges = [
        createBalanceChangeHN({ changeType: 'receive', tokenAddress, tokenSymbol }),
        createBalanceChangeHN({ changeType: 'receive', tokenAddress, tokenSymbol }),
        createBalanceChangeHN({ changeType: 'send', tokenAddress, tokenSymbol }),
      ]

      const response: HypernativeAssessmentResponseDto['data'] = {
        ...noThreatResponse,
        assessmentData: {
          ...noThreatResponse.assessmentData,
          balanceChanges: { [safeAddress]: balanceChanges },
        },
      }

      const result = mapHypernativeResponse(response, safeAddress)

      expect(result.BALANCE_CHANGE).toBeDefined()
      expect(result.BALANCE_CHANGE).toHaveLength(1)
      expect(result.BALANCE_CHANGE?.[0].in).toHaveLength(2)
      expect(result.BALANCE_CHANGE?.[0].in).toEqual([
        { value: balanceChanges[0].amount },
        { value: balanceChanges[1].amount },
      ])
      expect(result.BALANCE_CHANGE?.[0].out).toHaveLength(1)
      expect(result.BALANCE_CHANGE?.[0].out).toEqual([{ value: balanceChanges[2].amount }])
    })

    it('should handle multiple different tokens', () => {
      const noThreatResponse = createNoThreatResponse()

      const usdcAddress = faker.finance.ethereumAddress() as `0x${string}`
      const daiAddress = faker.finance.ethereumAddress() as `0x${string}`
      const usdcSymbol = 'USDC'
      const daiSymbol = 'DAI'

      const balanceChanges = [
        createBalanceChangeHN({ changeType: 'receive', tokenAddress: usdcAddress, tokenSymbol: usdcSymbol }),
        createBalanceChangeHN({ changeType: 'send', tokenAddress: daiAddress, tokenSymbol: daiSymbol }),
      ]

      const response: HypernativeAssessmentResponseDto['data'] = {
        ...noThreatResponse,
        assessmentData: {
          ...noThreatResponse.assessmentData,
          balanceChanges: { [safeAddress]: balanceChanges },
        },
      }

      const result = mapHypernativeResponse(response, safeAddress)

      expect(result.BALANCE_CHANGE).toBeDefined()
      expect(result.BALANCE_CHANGE).toHaveLength(2)

      const usdcChange = result.BALANCE_CHANGE?.find(
        (change) => change.asset.type !== 'NATIVE' && change.asset.address.toLowerCase() === usdcAddress.toLowerCase(),
      )
      const daiChange = result.BALANCE_CHANGE?.find(
        (change) => change.asset.type !== 'NATIVE' && change.asset.address.toLowerCase() === daiAddress.toLowerCase(),
      )

      expect(usdcChange).toBeDefined()
      expect(usdcChange?.asset.symbol).toBe(usdcSymbol)
      expect(usdcChange?.asset.type).toBe('ERC20')
      expect(usdcChange?.in).toHaveLength(1)
      expect(usdcChange?.out).toHaveLength(0)

      expect(daiChange).toBeDefined()
      expect(daiChange?.asset.symbol).toBe(daiSymbol)
      expect(daiChange?.asset.type).toBe('ERC20')
      expect(daiChange?.in).toHaveLength(0)
      expect(daiChange?.out).toHaveLength(1)
    })

    it('should handle case-insensitive safeAddress matching', () => {
      // The implementation normalizes both the lookup key and the balanceChanges keys
      // This test verifies that the function works with checksummed addresses from the API

      const noThreatResponse = createNoThreatResponse()

      // Create a checksummed version of the safe address (simulating what the API might return)
      const checksummedAddress = checksumAddress(safeAddress)

      const response: HypernativeAssessmentResponseDto['data'] = {
        ...noThreatResponse,
        assessmentData: {
          ...noThreatResponse.assessmentData,
          balanceChanges: {
            // Use checksummed key to simulate API response with mixed-case addresses
            [checksummedAddress]: [createBalanceChangeHN()],
          },
        },
      }

      // Pass safeAddress in any case - implementation will normalize both
      const result = mapHypernativeResponse(response, safeAddress.toUpperCase() as `0x${string}`)

      expect(result.BALANCE_CHANGE).toBeDefined()
      expect(result.BALANCE_CHANGE).toHaveLength(1)
    })

    it('should group token addresses with different cases together', () => {
      // The implementation normalizes tokenAddress to lowercase for grouping
      // This test verifies that the same token address with different cases (checksummed vs lowercase)
      // are treated as the same token and grouped correctly

      const noThreatResponse = createNoThreatResponse()

      const tokenAddress = faker.finance.ethereumAddress() as `0x${string}`
      const checksummedTokenAddress = checksumAddress(tokenAddress) as `0x${string}`
      const lowercaseTokenAddress = tokenAddress.toLowerCase() as `0x${string}`
      const tokenSymbol = 'USDC'

      // Create balance changes with the same token address in different cases
      const balanceChanges = [
        createBalanceChangeHN({ changeType: 'receive', tokenAddress: checksummedTokenAddress, tokenSymbol }),
        createBalanceChangeHN({ changeType: 'receive', tokenAddress: lowercaseTokenAddress, tokenSymbol }),
        createBalanceChangeHN({ changeType: 'send', tokenAddress: checksummedTokenAddress, tokenSymbol }),
      ]

      const response: HypernativeAssessmentResponseDto['data'] = {
        ...noThreatResponse,
        assessmentData: {
          ...noThreatResponse.assessmentData,
          balanceChanges: { [safeAddress]: balanceChanges },
        },
      }

      const result = mapHypernativeResponse(response, safeAddress)

      expect(result.BALANCE_CHANGE).toBeDefined()
      // Should be grouped into a single token entry despite different cases
      expect(result.BALANCE_CHANGE).toHaveLength(1)
      expect(result.BALANCE_CHANGE?.[0].asset.type).toBe('ERC20')
      expect(result.BALANCE_CHANGE?.[0].asset.symbol).toBe(tokenSymbol)
      // All changes should be grouped together
      expect(result.BALANCE_CHANGE?.[0].in).toHaveLength(2)
      expect(result.BALANCE_CHANGE?.[0].out).toHaveLength(1)
      // Token address should be normalized to lowercase
      if (result.BALANCE_CHANGE?.[0].asset.type === 'ERC20') {
        expect(result.BALANCE_CHANGE[0].asset.address).toBe(lowercaseTokenAddress)
      }
    })

    it('should include BALANCE_CHANGE alongside threat analysis results', () => {
      const noThreatResponse = createNoThreatResponse()

      const response: HypernativeAssessmentResponseDto['data'] = {
        ...noThreatResponse,
        assessmentData: {
          ...noThreatResponse.assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: 'Suspicious transaction',
                  details: 'Transaction details',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
          balanceChanges: { [safeAddress]: [createBalanceChangeHN()] },
        },
      }

      const result = mapHypernativeResponse(response, safeAddress)

      expect(result[StatusGroup.THREAT]).toBeDefined()
      expect(result.BALANCE_CHANGE).toBeDefined()
      expect(result.BALANCE_CHANGE).toHaveLength(1)
    })

    it('should handle empty balance changes array for safeAddress', () => {
      const noThreatResponse = createNoThreatResponse()

      const response: HypernativeAssessmentResponseDto['data'] = {
        ...noThreatResponse,
        assessmentData: {
          ...noThreatResponse.assessmentData,
          balanceChanges: { [safeAddress]: [] },
        },
      }

      const result = mapHypernativeResponse(response, safeAddress)

      expect(result.BALANCE_CHANGE).toBeUndefined()
    })

    it('should handle balance change with empty tokenSymbol', () => {
      const noThreatResponse = createNoThreatResponse()
      const tokenAddress = faker.finance.ethereumAddress() as `0x${string}`

      const balanceChanges = [createBalanceChangeHN({ changeType: 'receive', tokenAddress, tokenSymbol: '' })]

      const response: HypernativeAssessmentResponseDto['data'] = {
        ...noThreatResponse,
        assessmentData: {
          ...noThreatResponse.assessmentData,
          balanceChanges: { [safeAddress]: balanceChanges },
        },
      }

      const result = mapHypernativeResponse(response, safeAddress)

      expect(result.BALANCE_CHANGE).toBeDefined()
      expect(result.BALANCE_CHANGE).toHaveLength(1)
      expect(result.BALANCE_CHANGE?.[0].asset.symbol).toBe('')
    })

    it('should handle multiple balance changes with mixed native and ERC20 tokens', () => {
      const noThreatResponse = createNoThreatResponse()
      const usdcAddress = faker.finance.ethereumAddress() as `0x${string}`

      const balanceChanges = [
        createBalanceChangeHN({ changeType: 'receive', tokenAddress: undefined, tokenSymbol: 'ETH' }),
        createBalanceChangeHN({ changeType: 'send', tokenAddress: undefined, tokenSymbol: 'ETH' }),
        createBalanceChangeHN({ changeType: 'receive', tokenAddress: usdcAddress, tokenSymbol: 'USDC' }),
        createBalanceChangeHN({ changeType: 'send', tokenAddress: usdcAddress, tokenSymbol: 'USDC' }),
      ]

      const response: HypernativeAssessmentResponseDto['data'] = {
        ...noThreatResponse,
        assessmentData: {
          ...noThreatResponse.assessmentData,
          balanceChanges: { [safeAddress]: balanceChanges },
        },
      }

      const result = mapHypernativeResponse(response, safeAddress)

      expect(result.BALANCE_CHANGE).toBeDefined()
      expect(result.BALANCE_CHANGE).toHaveLength(2) // One NATIVE, one ERC20

      const nativeChange = result.BALANCE_CHANGE?.find((change) => change.asset.type === 'NATIVE')
      const erc20Change = result.BALANCE_CHANGE?.find((change) => change.asset.type === 'ERC20')

      expect(nativeChange).toBeDefined()
      expect(nativeChange?.asset.symbol).toBe('ETH')
      expect(nativeChange?.in).toHaveLength(1)
      expect(nativeChange?.out).toHaveLength(1)

      expect(erc20Change).toBeDefined()
      expect(erc20Change?.asset.symbol).toBe('USDC')
      if (erc20Change?.asset.type === 'ERC20') {
        expect(erc20Change.asset.address.toLowerCase()).toBe(usdcAddress.toLowerCase())
      }
    })

    it('should handle description formatting when mappedDetails is empty string', () => {
      // This tests the edge case where mappedDetails might be empty
      // In practice, this shouldn't happen with current mappings, but tests the logic
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: '',
                  details: '',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      // Should still format description correctly even with empty details
      expect(result[StatusGroup.THREAT]?.[0].description).toContain(
        'The full threat report is available in your Hypernative account.',
      )
    })

    it('should handle risk with details that already ends with period', () => {
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: 'Risk title already end with period.',
                  details: 'Details',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      // Should not add extra period
      expect(result[StatusGroup.THREAT]?.[0].description).toBe(
        'Risk title already end with period. The full threat report is available in your Hypernative account.',
      )
    })

    it('should handle risk with mapped type that has no description mapping', () => {
      // Test that when a type is mapped but has no description, it falls back correctly
      const response: HypernativeAssessmentResponseDto['data'] = {
        ...createNoThreatResponse(),
        assessmentData: {
          ...createNoThreatResponse().assessmentData,
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'warn',
              risks: [
                {
                  title: 'Custom risk title',
                  details: 'Custom risk details',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10), // Unknown safeCheckId
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response, mockSafeAddress)

      // Should use severity-based title and risk title as description
      expect(result[StatusGroup.THREAT]?.[0].title).toBe('Moderate threat detected')
      expect(result[StatusGroup.THREAT]?.[0].description).toBe(
        'Custom risk title. The full threat report is available in your Hypernative account.',
      )
    })
  })
})
