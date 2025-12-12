import { getOverallStatus } from '../getOverallStatus'
import { Severity, StatusGroup } from '../../types'
import type { RecipientAnalysisResults, ContractAnalysisResults, ThreatAnalysisResults } from '../../types'
import { RecipientAnalysisResultBuilder } from '../../builders/recipient-analysis-result.builder'
import { ContractAnalysisResultBuilder } from '../../builders/contract-analysis-result.builder'
import { ThreatAnalysisResultBuilder } from '../../builders/threat-analysis-result.builder'

describe('getOverallStatus', () => {
  describe('undefined cases', () => {
    it('should return undefined when no results are provided', () => {
      const result = getOverallStatus()
      expect(result).toBeUndefined()
    })

    it('should return undefined when both recipient and contract results are undefined', () => {
      const result = getOverallStatus(undefined, undefined)
      expect(result).toBeUndefined()
    })

    it('should return undefined when only hnLoginRequired is false', () => {
      const result = getOverallStatus(undefined, undefined, undefined, false, false)
      expect(result).toBeUndefined()
    })

    it('should return INFO severity when hnLoginRequired is true with no analysis results', () => {
      const result = getOverallStatus(undefined, undefined, undefined, false, true)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.INFO)
      expect(result!.title).toBe('Authentication required')
    })

    it('should return WARN severity when simulation fails with no analysis results', () => {
      const result = getOverallStatus(undefined, undefined, undefined, true)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.WARN)
      expect(result!.title).toBe('Issues found')
    })

    it('should return threat result when both recipient and contract results are undefined with threat results', () => {
      const threatResults = {
        '0xThreat1': {
          [StatusGroup.THREAT]: ThreatAnalysisResultBuilder.malicious().build(),
        },
      } as unknown as ThreatAnalysisResults
      const result = getOverallStatus(undefined, undefined, threatResults)
      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.CRITICAL)
      expect(result!.title).toBe('Risk detected')
    })
  })

  describe('recipient analysis results only', () => {
    it('should return OK severity for known recipient', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        },
      }

      const result = getOverallStatus(recipientResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.OK)
      expect(result!.title).toBe('Checks passed')
    })

    it('should return WARN severity for low activity recipient', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
        },
      }

      const result = getOverallStatus(recipientResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.WARN)
      expect(result!.title).toBe('Issues found')
    })

    it('should return INFO severity for new recipient', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
        },
      }

      const result = getOverallStatus(recipientResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.INFO)
      expect(result!.title).toBe('Review details')
    })

    it('should return highest severity when multiple recipient results exist', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
          [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
        },
      }

      const result = getOverallStatus(recipientResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.WARN)
      expect(result!.title).toBe('Issues found')
    })
  })

  describe('contract analysis results only', () => {
    it('should return OK severity for verified contract', () => {
      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          name: 'Test Contract',
          logoUrl: 'https://example.com/logo.png',
          [StatusGroup.CONTRACT_VERIFICATION]: [ContractAnalysisResultBuilder.verified().build()],
        },
      }

      const result = getOverallStatus(undefined, contractResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.OK)
      expect(result!.title).toBe('Checks passed')
    })

    it('should return INFO severity for not verified contract', () => {
      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          name: 'Test Contract',
          logoUrl: 'https://example.com/logo.png',
          [StatusGroup.CONTRACT_VERIFICATION]: [ContractAnalysisResultBuilder.unverified().build()],
        },
      }

      const result = getOverallStatus(undefined, contractResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.INFO)
      expect(result!.title).toBe('Review details')
    })

    it('should return WARN severity for verification unavailable contract', () => {
      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          name: 'Test Contract',
          logoUrl: 'https://example.com/logo.png',
          [StatusGroup.CONTRACT_VERIFICATION]: [ContractAnalysisResultBuilder.verificationUnavailable().build()],
        },
      }

      const result = getOverallStatus(undefined, contractResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.WARN)
      expect(result!.title).toBe('Issues found')
    })
  })

  describe('combined recipient and contract results', () => {
    it('should return highest severity across both recipient and contract results', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        },
      }

      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          name: 'Test Contract',
          logoUrl: 'https://example.com/logo.png',
          [StatusGroup.CONTRACT_VERIFICATION]: [ContractAnalysisResultBuilder.unverified().build()],
        },
      }

      const result = getOverallStatus(recipientResults, contractResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.INFO)
      expect(result!.title).toBe('Review details')
    })

    it('should handle multiple addresses with mixed severities', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        },
        '0xRecipient2': {
          [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
        },
      }

      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          name: 'Test Contract',
          logoUrl: 'https://example.com/logo.png',
          [StatusGroup.CONTRACT_VERIFICATION]: [ContractAnalysisResultBuilder.verified().build()],
        },
      }

      const result = getOverallStatus(recipientResults, contractResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.WARN)
      expect(result!.title).toBe('Issues found')
    })
  })

  describe('threat analysis results', () => {
    it('should include threat results with CRITICAL severity', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        },
      }

      const threatResults = {
        '0xThreat1': {
          [StatusGroup.THREAT]: ThreatAnalysisResultBuilder.malicious().build(),
        },
      } as unknown as ThreatAnalysisResults

      const result = getOverallStatus(recipientResults, undefined, threatResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.CRITICAL)
      expect(result!.title).toBe('Risk detected')
    })

    it('should prioritize threat results over other results when severity is higher', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
        },
      }

      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          name: 'Test Contract',
          logoUrl: 'https://example.com/logo.png',
          [StatusGroup.CONTRACT_VERIFICATION]: [ContractAnalysisResultBuilder.verified().build()],
        },
      }

      const threatResults = {
        '0xThreat1': {
          [StatusGroup.THREAT]: ThreatAnalysisResultBuilder.malicious().build(),
        },
      } as unknown as ThreatAnalysisResults

      const result = getOverallStatus(recipientResults, contractResults, threatResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.CRITICAL)
      expect(result!.title).toBe('Risk detected')
    })

    it('should include INFO threat results in overall calculation', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.unknownRecipient().build()],
        },
      }

      const threatResults = {
        '0xThreat1': {
          [StatusGroup.THREAT]: ThreatAnalysisResultBuilder.noThreat().build(),
        },
      } as unknown as ThreatAnalysisResults

      const result = getOverallStatus(recipientResults, undefined, threatResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.INFO)
      expect(result!.title).toBe('Review details')
    })
  })

  describe('complex scenarios', () => {
    it('should handle multiple recipients and contracts with all severity levels', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
          [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
          [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
        },
        '0xRecipient2': {
          [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
        },
      }

      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          name: 'Test Contract 1',
          logoUrl: 'https://example.com/logo1.png',
          [StatusGroup.CONTRACT_VERIFICATION]: [ContractAnalysisResultBuilder.verified().build()],
        },
        '0xContract2': {
          name: 'Test Contract 2',
          logoUrl: 'https://example.com/logo2.png',
          [StatusGroup.CONTRACT_VERIFICATION]: [ContractAnalysisResultBuilder.unverified().build()],
        },
      }

      const result = getOverallStatus(recipientResults, contractResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.WARN)
      expect(result!.title).toBe('Issues found')
    })

    it('should handle empty results objects gracefully', () => {
      const recipientResults: RecipientAnalysisResults = {}
      const contractResults: ContractAnalysisResults = {}

      const result = getOverallStatus(recipientResults, contractResults)

      expect(result).toBeUndefined()
    })

    it('should handle results with empty group arrays', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: [],
        },
      }

      const result = getOverallStatus(recipientResults)

      expect(result).toBeUndefined()
    })

    it('should skip non-array group results in recipient analysis', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
          [StatusGroup.RECIPIENT_ACTIVITY]: {} as any, // Non-array value
        },
      }

      const result = getOverallStatus(recipientResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.OK)
      expect(result!.title).toBe('Checks passed')
    })

    it('should skip non-array group results in contract analysis', () => {
      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          name: 'Test Contract',
          logoUrl: 'https://example.com/logo.png',
          [StatusGroup.CONTRACT_VERIFICATION]: [ContractAnalysisResultBuilder.verified().build()],
          [StatusGroup.CONTRACT_INTERACTION]: 'invalid' as any, // Non-array value
        },
      }

      const result = getOverallStatus(undefined, contractResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.OK)
      expect(result!.title).toBe('Checks passed')
    })

    it('should handle mixed array and non-array group results across all analysis types', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: null as any, // Non-array value
          [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
        },
      }

      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          name: 'Test Contract',
          logoUrl: 'https://example.com/logo.png',
          [StatusGroup.CONTRACT_VERIFICATION]: [ContractAnalysisResultBuilder.verified().build()],
          [StatusGroup.CONTRACT_INTERACTION]: undefined as any, // Non-array value
        },
      }

      const threatResults = {
        '0xThreat1': {
          [StatusGroup.THREAT]: ThreatAnalysisResultBuilder.noThreat().build(),
        },
      } as unknown as ThreatAnalysisResults

      const result = getOverallStatus(recipientResults, contractResults, threatResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.WARN)
      expect(result!.title).toBe('Issues found')
    })

    it('should return undefined when all group results are non-array values', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: null as any,
          [StatusGroup.RECIPIENT_ACTIVITY]: {} as any,
        },
      }

      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          name: 'Test Contract',
          logoUrl: 'https://example.com/logo.png',
          [StatusGroup.CONTRACT_VERIFICATION]: 'invalid' as any,
        },
      }

      const result = getOverallStatus(recipientResults, contractResults)

      expect(result).toBeUndefined()
    })
  })

  describe('hnLoginRequired parameter', () => {
    it('should return INFO severity with Authentication required title when hnLoginRequired is true', () => {
      const result = getOverallStatus(undefined, undefined, undefined, false, true)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.INFO)
      expect(result!.title).toBe('Authentication required')
    })

    it('should prioritize CRITICAL severity over hnLoginRequired INFO', () => {
      const threatResults = {
        '0xThreat1': {
          [StatusGroup.THREAT]: ThreatAnalysisResultBuilder.malicious().build(),
        },
      } as unknown as ThreatAnalysisResults

      const result = getOverallStatus(undefined, undefined, threatResults, false, true)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.CRITICAL)
      expect(result!.title).toBe('Risk detected')
    })

    it('should prioritize WARN severity over hnLoginRequired INFO', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.RECIPIENT_ACTIVITY]: [RecipientAnalysisResultBuilder.lowActivity().build()],
        },
      }

      const result = getOverallStatus(recipientResults, undefined, undefined, false, true)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.WARN)
      expect(result!.title).toBe('Issues found')
    })

    it('should prioritize simulation error WARN over hnLoginRequired INFO', () => {
      const result = getOverallStatus(undefined, undefined, undefined, true, true)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.WARN)
      expect(result!.title).toBe('Issues found')
    })

    it('should return INFO severity when hnLoginRequired is true and only OK results exist', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        },
      }

      const result = getOverallStatus(recipientResults, undefined, undefined, false, true)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.INFO)
      expect(result!.title).toBe('Authentication required')
    })

    it('should return INFO severity when hnLoginRequired is true and only INFO results exist', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.RECIPIENT_INTERACTION]: [RecipientAnalysisResultBuilder.newRecipient().build()],
        },
      }

      const result = getOverallStatus(recipientResults, undefined, undefined, false, true)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.INFO)
      expect(result!.title).toBe('Review details')
    })

    it('should handle hnLoginRequired with multiple analysis results and prioritize highest severity', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        },
      }

      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          name: 'Test Contract',
          logoUrl: 'https://example.com/logo.png',
          [StatusGroup.CONTRACT_VERIFICATION]: [ContractAnalysisResultBuilder.unverified().build()],
        },
      }

      const result = getOverallStatus(recipientResults, contractResults, undefined, false, true)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.INFO)
      expect(result!.title).toBe('Review details')
    })

    it('should handle hnLoginRequired with threat results and prioritize CRITICAL', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: [RecipientAnalysisResultBuilder.knownRecipient().build()],
        },
      }

      const threatResults = {
        '0xThreat1': {
          [StatusGroup.THREAT]: ThreatAnalysisResultBuilder.malicious().build(),
        },
      } as unknown as ThreatAnalysisResults

      const result = getOverallStatus(recipientResults, undefined, threatResults, false, true)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.CRITICAL)
      expect(result!.title).toBe('Risk detected')
    })

    it('should handle hnLoginRequired with simulation error and threat results', () => {
      const threatResults = {
        '0xThreat1': {
          [StatusGroup.THREAT]: ThreatAnalysisResultBuilder.malicious().build(),
        },
      } as unknown as ThreatAnalysisResults

      const result = getOverallStatus(undefined, undefined, threatResults, true, true)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.CRITICAL)
      expect(result!.title).toBe('Risk detected')
    })
  })
})
