import { IconName } from '@/src/types/iconTypes'
import { AlertType } from '@/src/components/Alert'

export interface SecurityState {
  enabled: boolean
  isScanning: boolean
  hasError: boolean
  payload: unknown
  error: Error | undefined
  isHighRisk: boolean
  isMediumRisk: boolean
  hasWarnings: boolean
  hasIssues: boolean
  hasContractManagement: boolean
}

export const getTransactionChecksIcon = (security: SecurityState): IconName => {
  if (security.hasError) {
    return 'shield-crossed'
  }
  if (security.isMediumRisk || security.hasContractManagement) {
    return 'alert-triangle'
  }
  return 'shield'
}

export const getTransactionChecksLabel = (isScanning: boolean): string => {
  if (isScanning) {
    return 'Checking transaction...'
  }
  return 'Transaction checks'
}

export const getAlertType = (security: SecurityState): AlertType => {
  if (security.isHighRisk) {
    return 'error'
  }
  if (security.isMediumRisk) {
    return 'warning'
  }
  return 'info'
}

export const shouldShowBottomContent = (security: SecurityState): boolean => {
  if (!security.enabled) {
    return false
  }
  return security.hasIssues || security.hasContractManagement || !!security.error
}
