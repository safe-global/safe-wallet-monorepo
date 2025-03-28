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
  useEffect,
} from 'react'
import type { BlockaidModuleResponse } from '@/services/security/modules/BlockaidModule'
import { useBlockaid, useBlockaidReportScan } from '../blockaid/useBlockaid'
import useDebounce from '@/hooks/useDebounce'

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
  const txData = useDebounce(safeTx ?? safeMessage, 300)
  const [blockaidResponse, blockaidError, blockaidLoading] = useBlockaid(txData, txOrigin)
  const reportScan = useBlockaidReportScan(blockaidResponse?.payload?.requestId)
  const needsRiskConfirmation = !!blockaidResponse && blockaidResponse.severity >= SecuritySeverity.HIGH

  const [isRiskConfirmed, setIsRiskConfirmed] = useState(false)
  const [isRiskIgnored, setIsRiskIgnored] = useState(false)

  // Report scan status when risk is confirmed or ignored
  useEffect(() => {
    // Risk is accepted, meaning the user rejected the warning
    if (needsRiskConfirmation && isRiskConfirmed) reportScan(false)

    // The context is unmounted = the user closed the tx
    return () => {
      // Tx abandoned likely due to warning
      if (needsRiskConfirmation && !isRiskConfirmed) reportScan(true)
    }
  }, [isRiskConfirmed, needsRiskConfirmation, reportScan])

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
