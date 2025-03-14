import { SecuritySeverity } from '@/services/security/modules/types'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
  type ReactElement,
} from 'react'
import type { BlockaidModuleResponse } from '@/services/security/modules/BlockaidModule'
import { useBlockaid } from '../blockaid/useBlockaid'

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

export const TxSecurityContext = createContext<TxSecurityContextProps>(defaultSecurityContextValues)

export const TxSecurityProvider = ({ children }: { children: ReactElement }) => {
  const { safeTx, safeMessage, txOrigin } = useContext(SafeTxContext)
  const [blockaidResponse, blockaidError, blockaidLoading] = useBlockaid(safeTx ?? safeMessage, txOrigin)

  const [isRiskConfirmed, setIsRiskConfirmed] = useState(false)
  const [isRiskIgnored, setIsRiskIgnored] = useState(false)

  const providedValue = useMemo(
    () => ({
      blockaidResponse: {
        description: blockaidResponse?.payload?.description,
        reason: blockaidResponse?.payload?.reason,
        classification: blockaidResponse?.payload?.classification,
        severity: blockaidResponse?.severity,
        warnings: blockaidResponse?.payload?.issues || [],
        balanceChange: blockaidResponse?.payload?.balanceChange,
        contractManagement: blockaidResponse?.payload?.contractManagement,
        error: blockaidError,
        isLoading: blockaidLoading,
      },
      needsRiskConfirmation: !!blockaidResponse && blockaidResponse.severity >= SecuritySeverity.HIGH,
      isRiskConfirmed,
      setIsRiskConfirmed,
      isRiskIgnored: isRiskIgnored && !isRiskConfirmed,
      setIsRiskIgnored,
    }),
    [blockaidError, blockaidLoading, blockaidResponse, isRiskConfirmed, isRiskIgnored],
  )

  return <TxSecurityContext.Provider value={providedValue}>{children}</TxSecurityContext.Provider>
}
