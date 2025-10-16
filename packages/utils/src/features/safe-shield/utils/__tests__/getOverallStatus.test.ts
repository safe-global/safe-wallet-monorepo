import { getOverallStatus } from '../getOverallStatus'
import { Severity, RecipientStatus, ContractStatus, ThreatStatus, StatusGroup } from '../../types'
import type { RecipientAnalysisResults, ContractAnalysisResults, ThreatAnalysisResult } from '../../types'

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

    it('should return undefined when both recipient and contract results are undefined with threat results', () => {
      const threatResults: ThreatAnalysisResult = {
        type: ThreatStatus.MALICIOUS,
        severity: Severity.CRITICAL,
        title: 'Malicious',
        description: 'Critical threat detected',
      }
      const result = getOverallStatus(undefined, undefined, threatResults)
      expect(result).toBeUndefined()
    })
  })

  describe('recipient analysis results only', () => {
    it('should return OK severity for known recipient', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: [
            {
              type: RecipientStatus.KNOWN_RECIPIENT,
              severity: Severity.OK,
              title: 'Known Recipient',
              description: 'This recipient is in your address book',
            },
          ],
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
          [StatusGroup.RECIPIENT_ACTIVITY]: [
            {
              type: RecipientStatus.LOW_ACTIVITY,
              severity: Severity.WARN,
              title: 'Low Activity',
              description: 'This recipient has low activity',
            },
          ],
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
          [StatusGroup.RECIPIENT_INTERACTION]: [
            {
              type: RecipientStatus.NEW_RECIPIENT,
              severity: Severity.INFO,
              title: 'New Recipient',
              description: 'First interaction with this recipient',
            },
          ],
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
          [StatusGroup.ADDRESS_BOOK]: [
            {
              type: RecipientStatus.KNOWN_RECIPIENT,
              severity: Severity.OK,
              title: 'Known Recipient',
              description: 'In address book',
            },
          ],
          [StatusGroup.RECIPIENT_ACTIVITY]: [
            {
              type: RecipientStatus.LOW_ACTIVITY,
              severity: Severity.WARN,
              title: 'Low Activity',
              description: 'Low activity detected',
            },
          ],
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
          [StatusGroup.CONTRACT_VERIFICATION]: [
            {
              type: ContractStatus.VERIFIED,
              severity: Severity.OK,
              title: 'Verified Contract',
              description: 'Contract is verified',
            },
          ],
        },
      }

      const result = getOverallStatus(undefined, contractResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.OK)
      expect(result!.title).toBe('Checks passed')
    })

    it('should return CRITICAL severity for not verified contract', () => {
      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          [StatusGroup.CONTRACT_VERIFICATION]: [
            {
              type: ContractStatus.NOT_VERIFIED,
              severity: Severity.CRITICAL,
              title: 'Not Verified',
              description: 'Contract is not verified',
            },
          ],
        },
      }

      const result = getOverallStatus(undefined, contractResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.CRITICAL)
      expect(result!.title).toBe('Risk detected')
    })

    it('should return WARN severity for new contract', () => {
      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          [StatusGroup.CONTRACT_INTERACTION]: [
            {
              type: ContractStatus.NEW_CONTRACT,
              severity: Severity.WARN,
              title: 'New Contract',
              description: 'Contract was recently deployed',
            },
          ],
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
          [StatusGroup.ADDRESS_BOOK]: [
            {
              type: RecipientStatus.KNOWN_RECIPIENT,
              severity: Severity.OK,
              title: 'Known Recipient',
              description: 'In address book',
            },
          ],
        },
      }

      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          [StatusGroup.CONTRACT_VERIFICATION]: [
            {
              type: ContractStatus.NOT_VERIFIED,
              severity: Severity.CRITICAL,
              title: 'Not Verified',
              description: 'Contract is not verified',
            },
          ],
        },
      }

      const result = getOverallStatus(recipientResults, contractResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.CRITICAL)
      expect(result!.title).toBe('Risk detected')
    })

    it('should handle multiple addresses with mixed severities', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: [
            {
              type: RecipientStatus.KNOWN_RECIPIENT,
              severity: Severity.OK,
              title: 'Known',
              description: 'Known recipient',
            },
          ],
        },
        '0xRecipient2': {
          [StatusGroup.RECIPIENT_ACTIVITY]: [
            {
              type: RecipientStatus.LOW_ACTIVITY,
              severity: Severity.WARN,
              title: 'Low Activity',
              description: 'Low activity',
            },
          ],
        },
      }

      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          [StatusGroup.CONTRACT_VERIFICATION]: [
            {
              type: ContractStatus.VERIFIED,
              severity: Severity.OK,
              title: 'Verified',
              description: 'Verified contract',
            },
          ],
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
          [StatusGroup.ADDRESS_BOOK]: [
            {
              type: RecipientStatus.KNOWN_RECIPIENT,
              severity: Severity.OK,
              title: 'Known',
              description: 'Known recipient',
            },
          ],
        },
      }

      const threatResults: ThreatAnalysisResult = {
        type: ThreatStatus.MALICIOUS,
        severity: Severity.CRITICAL,
        title: 'Malicious Threat',
        description: 'Critical threat detected',
      }

      const result = getOverallStatus(recipientResults, undefined, threatResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.CRITICAL)
      expect(result!.title).toBe('Risk detected')
    })

    it('should prioritize threat results over other results when severity is higher', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.RECIPIENT_ACTIVITY]: [
            {
              type: RecipientStatus.LOW_ACTIVITY,
              severity: Severity.WARN,
              title: 'Low Activity',
              description: 'Low activity',
            },
          ],
        },
      }

      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          [StatusGroup.CONTRACT_VERIFICATION]: [
            {
              type: ContractStatus.VERIFIED,
              severity: Severity.OK,
              title: 'Verified',
              description: 'Verified contract',
            },
          ],
        },
      }

      const threatResults: ThreatAnalysisResult = {
        type: ThreatStatus.MALICIOUS,
        severity: Severity.CRITICAL,
        title: 'Critical Threat',
        description: 'Critical threat detected',
      }

      const result = getOverallStatus(recipientResults, contractResults, threatResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.CRITICAL)
      expect(result!.title).toBe('Risk detected')
    })

    it('should include INFO threat results in overall calculation', () => {
      const recipientResults: RecipientAnalysisResults = {
        '0xRecipient1': {
          [StatusGroup.ADDRESS_BOOK]: [
            {
              type: RecipientStatus.KNOWN_RECIPIENT,
              severity: Severity.OK,
              title: 'Known',
              description: 'Known recipient',
            },
          ],
        },
      }

      const threatResults: ThreatAnalysisResult = {
        type: ThreatStatus.NO_THREAT,
        severity: Severity.INFO,
        title: 'No Threat',
        description: 'No threat detected',
      }

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
          [StatusGroup.ADDRESS_BOOK]: [
            {
              type: RecipientStatus.KNOWN_RECIPIENT,
              severity: Severity.OK,
              title: 'Known',
              description: 'Known',
            },
          ],
          [StatusGroup.RECIPIENT_ACTIVITY]: [
            {
              type: RecipientStatus.HIGH_ACTIVITY,
              severity: Severity.OK,
              title: 'High Activity',
              description: 'High activity',
            },
          ],
          [StatusGroup.RECIPIENT_INTERACTION]: [
            {
              type: RecipientStatus.NEW_RECIPIENT,
              severity: Severity.INFO,
              title: 'New',
              description: 'New recipient',
            },
          ],
        },
        '0xRecipient2': {
          [StatusGroup.RECIPIENT_ACTIVITY]: [
            {
              type: RecipientStatus.LOW_ACTIVITY,
              severity: Severity.WARN,
              title: 'Low Activity',
              description: 'Low activity',
            },
          ],
        },
      }

      const contractResults: ContractAnalysisResults = {
        '0xContract1': {
          [StatusGroup.CONTRACT_VERIFICATION]: [
            {
              type: ContractStatus.VERIFIED,
              severity: Severity.OK,
              title: 'Verified',
              description: 'Verified',
            },
          ],
        },
        '0xContract2': {
          [StatusGroup.CONTRACT_VERIFICATION]: [
            {
              type: ContractStatus.NOT_VERIFIED,
              severity: Severity.CRITICAL,
              title: 'Not Verified',
              description: 'Not verified',
            },
          ],
        },
      }

      const result = getOverallStatus(recipientResults, contractResults)

      expect(result).toBeDefined()
      expect(result!.severity).toBe(Severity.CRITICAL)
      expect(result!.title).toBe('Risk detected')
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
  })
})
