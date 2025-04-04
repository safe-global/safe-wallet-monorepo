import type { BlockaidModuleResponse } from '@safe-global/utils/services/security/modules/BlockaidModule'
import { SecuritySeverity } from '@safe-global/utils/services/security/modules/types'
import type { Dispatch, SetStateAction } from 'react'

export type TxSecurityContextProps = {
  blockaidResponse:
    | {
        description: BlockaidModuleResponse['description']
        classification: BlockaidModuleResponse['classification']
        reason: BlockaidModuleResponse['reason']
        warnings: NonNullable<BlockaidModuleResponse['issues']>
        balanceChange: BlockaidModuleResponse['balanceChange'] | undefined
        severity: SecuritySeverity | undefined
        contractManagement: BlockaidModuleResponse['contractManagement'] | undefined
        isLoading: boolean
        error: Error | undefined
      }
    | undefined
  needsRiskConfirmation: boolean
  isRiskConfirmed: boolean
  setIsRiskConfirmed: Dispatch<SetStateAction<boolean>>
  isRiskIgnored: boolean
  setIsRiskIgnored: Dispatch<SetStateAction<boolean>>
}