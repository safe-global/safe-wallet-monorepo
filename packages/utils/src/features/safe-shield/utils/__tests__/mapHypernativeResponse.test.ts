import { faker } from '@faker-js/faker'
import { mapHypernativeResponse } from '../mapHypernativeResponse'
import { Severity, StatusGroup, ThreatStatus } from '../../types'
import type {
  HypernativeAssessmentFailedResponseDto,
  HypernativeAssessmentResponseDto,
} from '@safe-global/store/hypernative/hypernativeApi.dto'

describe('mapHypernativeResponse', () => {
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

  describe('status handling', () => {
    it('should return error result when status is FAILED', () => {
      const responseDescription = 'The threat analysis failed'
      const response: HypernativeAssessmentFailedResponseDto = {
        status: 'FAILED',
        error: {
          reason: 'Some reason',
          message: responseDescription,
        },
      }

      const result = mapHypernativeResponse(response)

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

      const result = mapHypernativeResponse(response)

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

      const result = mapHypernativeResponse(response)

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
                  details: 'Transfer to known phishing address',
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

      const result = mapHypernativeResponse(response)

      expect(result[StatusGroup.THREAT]?.[0]).toEqual({
        severity: Severity.CRITICAL,
        type: ThreatStatus.HYPERNATIVE_GUARD,
        title: 'Transfer to malicious',
        description: 'Transfer to known phishing address',
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
                  details: 'Swap volume unusually large',
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

      const result = mapHypernativeResponse(response)

      expect(result[StatusGroup.THREAT]?.[0]).toEqual({
        severity: Severity.WARN,
        type: ThreatStatus.HYPERNATIVE_GUARD,
        title: 'Suspicious swap pattern',
        description: 'Swap volume unusually large',
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
                  details: 'Transaction appears safe',
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

      const result = mapHypernativeResponse(response)

      expect(result[StatusGroup.THREAT]).toContainEqual({
        severity: Severity.OK,
        type: ThreatStatus.HYPERNATIVE_GUARD,
        title: 'All checks passed',
        description: 'Transaction appears safe',
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
                  details: 'Pool contains 4% of illicit funds',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
                {
                  title: 'Unusually high gas price',
                  details: 'Gas price higher than max allowed',
                  severity: 'warn',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
          },
        },
      }

      const result = mapHypernativeResponse(response)

      expect(result[StatusGroup.CUSTOM_CHECKS]).toContainEqual({
        severity: Severity.WARN,
        type: ThreatStatus.HYPERNATIVE_GUARD,
        title: 'Pool Toxicity',
        description: 'Pool contains 4% of illicit funds',
      })

      expect(result[StatusGroup.CUSTOM_CHECKS]).toContainEqual({
        severity: Severity.WARN,
        type: ThreatStatus.HYPERNATIVE_GUARD,
        title: 'Unusually high gas price',
        description: 'Gas price higher than max allowed',
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

      const result = mapHypernativeResponse(response)

      // THREAT_ANALYSIS has 1 deny risk
      expect(result[StatusGroup.THREAT]).toHaveLength(1)
      expect(result[StatusGroup.THREAT]?.[0].severity).toBe(Severity.CRITICAL)
      expect(result[StatusGroup.THREAT]?.[0].title).toBe('Transfer to malicious')

      // CUSTOM_CHECKS has 1 warn risk
      expect(result[StatusGroup.CUSTOM_CHECKS]).toHaveLength(1)
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[0].severity).toBe(Severity.WARN)
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[0].title).toBe('Pool Toxicity')
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

      const result = mapHypernativeResponse(response)

      // THREAT_ANALYSIS should be sorted: CRITICAL first, then WARN, then OK
      expect(result[StatusGroup.THREAT]).toHaveLength(3)
      expect(result[StatusGroup.THREAT]?.[0].severity).toBe(Severity.CRITICAL)
      expect(result[StatusGroup.THREAT]?.[0].title).toBe('Critical risk')
      expect(result[StatusGroup.THREAT]?.[1].severity).toBe(Severity.WARN)
      expect(result[StatusGroup.THREAT]?.[1].title).toBe('Warning risk')
      expect(result[StatusGroup.THREAT]?.[2].severity).toBe(Severity.OK)
      expect(result[StatusGroup.THREAT]?.[2].title).toBe('OK risk')
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

      const result = mapHypernativeResponse(response)

      expect(result[StatusGroup.THREAT]).toHaveLength(2)
      expect(result[StatusGroup.THREAT]?.[0].severity).toBe(Severity.WARN)
      expect(result[StatusGroup.THREAT]?.[0].title).toBe('First warning')
      expect(result[StatusGroup.THREAT]?.[1].severity).toBe(Severity.WARN)
      expect(result[StatusGroup.THREAT]?.[1].title).toBe('Second warning')
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

      const result = mapHypernativeResponse(response)

      expect(result[StatusGroup.THREAT]?.[0].type).toBe(ThreatStatus.OWNERSHIP_CHANGE)
      expect(result[StatusGroup.THREAT]?.[1].type).toBe(ThreatStatus.MODULE_CHANGE)
      expect(result[StatusGroup.THREAT]?.[2].type).toBe(ThreatStatus.UNOFFICIAL_FALLBACK_HANDLER)
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

      const result = mapHypernativeResponse(response)

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

      const result = mapHypernativeResponse(response)

      expect(result[StatusGroup.THREAT]?.[0].type).toBe(ThreatStatus.HYPERNATIVE_GUARD)
      expect(result[StatusGroup.THREAT]?.[0].title).toBe('Mastercopy change')
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

      const result = mapHypernativeResponse(response)

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

      const result = mapHypernativeResponse(response)

      expect(result[StatusGroup.THREAT]?.[0].type).toBe(ThreatStatus.OWNERSHIP_CHANGE)
      expect(result[StatusGroup.THREAT]?.[1].type).toBe(ThreatStatus.OWNERSHIP_CHANGE)
      expect(result[StatusGroup.THREAT]?.[2].type).toBe(ThreatStatus.MODULE_CHANGE)
      expect(result[StatusGroup.THREAT]?.[3].type).toBe(ThreatStatus.MODULE_CHANGE)
      expect(result[StatusGroup.THREAT]?.[4].type).toBe(ThreatStatus.UNOFFICIAL_FALLBACK_HANDLER)
    })
  })

  describe('edge cases', () => {
    it('should handle empty error message in FAILED response', () => {
      const response: HypernativeAssessmentFailedResponseDto = {
        status: 'FAILED',
        error: {
          reason: 'Some reason',
          message: undefined as any,
        },
      }

      const result = mapHypernativeResponse(response)

      expect(result[StatusGroup.THREAT]).toHaveLength(1)
      expect(result[StatusGroup.THREAT]?.[0]).toEqual({
        severity: Severity.CRITICAL,
        type: ThreatStatus.HYPERNATIVE_GUARD,
        title: 'Hypernative analysis failed',
        description: 'The threat analysis failed.',
      })
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

      const result = mapHypernativeResponse(response)

      expect(result[StatusGroup.CUSTOM_CHECKS]).toHaveLength(3)
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[0].severity).toBe(Severity.CRITICAL)
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[0].title).toBe('Critical custom check')
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[1].severity).toBe(Severity.WARN)
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[1].title).toBe('Warning custom check')
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[2].severity).toBe(Severity.OK)
      expect(result[StatusGroup.CUSTOM_CHECKS]?.[2].title).toBe('OK custom check')
    })
  })
})
