import {
  getTransactionChecksIcon,
  getTransactionChecksLabel,
  getAlertType,
  shouldShowBottomContent,
  SecurityState,
} from '../transactionChecksUtils'

describe('transactionChecksUtils', () => {
  const createSecurityState = (overrides: Partial<SecurityState> = {}): SecurityState => ({
    hasError: false,
    isMediumRisk: false,
    isHighRisk: false,
    hasContractManagement: false,
    isScanning: false,
    enabled: true,
    hasIssues: false,
    hasWarnings: false,
    error: undefined,
    payload: null,
    ...overrides,
  })

  describe('getTransactionChecksIcon', () => {
    it('should return shield-crossed when hasError is true', () => {
      const security = createSecurityState({ hasError: true })
      expect(getTransactionChecksIcon(security)).toBe('shield-crossed')
    })

    it('should return alert-triangle when isMediumRisk is true', () => {
      const security = createSecurityState({ isMediumRisk: true })
      expect(getTransactionChecksIcon(security)).toBe('alert-triangle')
    })

    it('should return alert-triangle when hasContractManagement is true', () => {
      const security = createSecurityState({ hasContractManagement: true })
      expect(getTransactionChecksIcon(security)).toBe('alert-triangle')
    })

    it('should return shield as default', () => {
      const security = createSecurityState()
      expect(getTransactionChecksIcon(security)).toBe('shield')
    })

    it('should prioritize hasError over other conditions', () => {
      const security = createSecurityState({
        hasError: true,
        isMediumRisk: true,
        hasContractManagement: true,
      })
      expect(getTransactionChecksIcon(security)).toBe('shield-crossed')
    })
  })

  describe('getTransactionChecksLabel', () => {
    it('should return scanning message when isScanning is true', () => {
      expect(getTransactionChecksLabel(true)).toBe('Checking transaction...')
    })

    it('should return default message when isScanning is false', () => {
      expect(getTransactionChecksLabel(false)).toBe('Transaction checks')
    })
  })

  describe('getAlertType', () => {
    it('should return error when isHighRisk is true', () => {
      const security = createSecurityState({ isHighRisk: true })
      expect(getAlertType(security)).toBe('error')
    })

    it('should return warning when isMediumRisk is true', () => {
      const security = createSecurityState({ isMediumRisk: true })
      expect(getAlertType(security)).toBe('warning')
    })

    it('should return info as default', () => {
      const security = createSecurityState()
      expect(getAlertType(security)).toBe('info')
    })

    it('should prioritize isHighRisk over isMediumRisk', () => {
      const security = createSecurityState({
        isHighRisk: true,
        isMediumRisk: true,
      })
      expect(getAlertType(security)).toBe('error')
    })
  })

  describe('shouldShowBottomContent', () => {
    it('should return false when security is disabled', () => {
      const security = createSecurityState({
        enabled: false,
        hasIssues: true,
      })
      expect(shouldShowBottomContent(security)).toBe(false)
    })

    it('should return true when hasIssues is true and enabled', () => {
      const security = createSecurityState({ hasIssues: true })
      expect(shouldShowBottomContent(security)).toBe(true)
    })

    it('should return true when hasContractManagement is true and enabled', () => {
      const security = createSecurityState({ hasContractManagement: true })
      expect(shouldShowBottomContent(security)).toBe(true)
    })

    it('should return true when error exists and enabled', () => {
      const security = createSecurityState({ error: new Error('Test error') })
      expect(shouldShowBottomContent(security)).toBe(true)
    })

    it('should return false when no conditions are met', () => {
      const security = createSecurityState()
      expect(shouldShowBottomContent(security)).toBe(false)
    })

    it('should return true when multiple conditions are true', () => {
      const security = createSecurityState({
        hasIssues: true,
        hasContractManagement: true,
        error: new Error('Test error'),
      })
      expect(shouldShowBottomContent(security)).toBe(true)
    })
  })
})
