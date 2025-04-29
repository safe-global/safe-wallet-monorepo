import { SecuritySeverity } from '@safe-global/utils/services/security/modules/types'

export const defaultSecurityContextValues = {
  blockaidResponse: {
    warnings: [],
    description: undefined,
    classification: undefined,
    reason: undefined,
    balanceChange: undefined,
    severity: SecuritySeverity.NONE,
    contractManagement: undefined,
    isLoading: false,
    error: undefined,
  },
  needsRiskConfirmation: false,
  isRiskConfirmed: false,
  setIsRiskConfirmed: () => {},
  isRiskIgnored: false,
  setIsRiskIgnored: () => {},
}