import { SecuritySeverity } from '@safe-global/utils/services/security/modules/types'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { createContext, type ReactElement, useContext, useMemo, useState } from 'react'
import { useBlockaid } from '../blockaid/useBlockaid'
import { defaultSecurityContextValues } from '@safe-global/utils/components/tx/security/shared/utils'
import { type TxSecurityContextProps } from '@safe-global/utils/components/tx/security/shared/types'

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
