import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { useCounterpartyAnalysis, useRecipientAnalysis, useThreatAnalysis } from './hooks'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { SafeTransaction } from '@safe-global/types-kit'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import {
  type ContractAnalysisResults,
  type ThreatAnalysisResults,
  type RecipientAnalysisResults,
  Severity,
} from '@safe-global/utils/features/safe-shield/types'
import { getPrimaryResult, SEVERITY_PRIORITY } from '@safe-global/utils/features/safe-shield/utils'
import { useNestedTransaction } from './components/useNestedTransaction'
import { useCurrentChain } from '@/hooks/useChains'

type SafeShieldContextType = {
  setRecipientAddresses: Dispatch<SetStateAction<string[] | undefined>>
  setSafeTx: Dispatch<SetStateAction<SafeTransaction | undefined>>
  safeTx?: SafeTransaction
  recipient: AsyncResult<RecipientAnalysisResults>
  contract: AsyncResult<ContractAnalysisResults>
  threat: AsyncResult<ThreatAnalysisResults>
  nestedThreat: AsyncResult<ThreatAnalysisResults>
  isNested: boolean
  needsRiskConfirmation: boolean
  isRiskConfirmed: boolean
  setIsRiskConfirmed: Dispatch<SetStateAction<boolean>>
}

const SafeShieldContext = createContext<SafeShieldContextType | null>(null)

export const SafeShieldProvider = ({ children }: { children: ReactNode }) => {
  const safeTxContext = useContext(SafeTxContext)
  const [recipientAddresses, setRecipientAddresses] = useState<string[] | undefined>(undefined)
  const [safeTx, setSafeTx] = useState<SafeTransaction | undefined>(undefined)

  const recipientOnlyAnalysis = useRecipientAnalysis(recipientAddresses)
  const counterpartyAnalysis = useCounterpartyAnalysis(safeTx)
  const threat = useThreatAnalysis(safeTx)

  const recipient = recipientOnlyAnalysis || counterpartyAnalysis.recipient
  const contract = counterpartyAnalysis.contract
  const safeShieldTx = safeTx || safeTxContext.safeTx

  const chain = useCurrentChain()
  const { nestedSafeTx, isNested } = useNestedTransaction(safeShieldTx, chain)
  const nestedThreat = useThreatAnalysis(isNested ? nestedSafeTx : undefined)

  const [isRiskConfirmed, setIsRiskConfirmed] = useState(false)

  const { needsRiskConfirmation, primaryThreatSeverity } = useMemo(() => {
    const [threatAnalysisResult] = threat || []
    const [nestedThreatAnalysisResult] = nestedThreat || []

    const primaryThreatResult = getPrimaryResult(threatAnalysisResult?.THREAT || [])
    const nestedPrimaryThreatResult = getPrimaryResult(nestedThreatAnalysisResult?.THREAT || [])

    const mainSeverity = primaryThreatResult?.severity
    const nestedSeverity = nestedPrimaryThreatResult?.severity

    const severity =
      mainSeverity && nestedSeverity
        ? SEVERITY_PRIORITY[mainSeverity] <= SEVERITY_PRIORITY[nestedSeverity]
          ? mainSeverity
          : nestedSeverity
        : mainSeverity || nestedSeverity

    const needsRiskConfirmation = !!severity && SEVERITY_PRIORITY[severity] <= SEVERITY_PRIORITY[Severity.CRITICAL]

    return {
      needsRiskConfirmation,
      primaryThreatSeverity: severity,
    }
  }, [threat, nestedThreat])

  useEffect(() => {
    setIsRiskConfirmed(false)
  }, [primaryThreatSeverity, safeShieldTx])

  return (
    <SafeShieldContext.Provider
      value={{
        setRecipientAddresses,
        setSafeTx,
        safeTx: safeShieldTx,
        recipient,
        contract,
        threat,
        nestedThreat,
        isNested,
        needsRiskConfirmation,
        isRiskConfirmed,
        setIsRiskConfirmed,
      }}
    >
      {children}
    </SafeShieldContext.Provider>
  )
}

export const useSafeShield = () => {
  const context = useContext(SafeShieldContext)
  if (!context) {
    throw new Error('useSafeShieldContext must be used within SafeShieldProvider')
  }
  return context
}

/**
 * Hook to register recipient addresses for Safe Shield analysis
 * @param recipientAddresses - Array of recipient addresses to analyze
 */
export const useSafeShieldForRecipients = (recipientAddresses: string[]) => {
  const { setRecipientAddresses, recipient } = useSafeShield()

  useEffect(() => {
    setRecipientAddresses(recipientAddresses)
  }, [recipientAddresses, setRecipientAddresses])

  return recipient
}

/**
 * Hook to register transaction data for Safe Shield analysis
 * @param txData - Transaction data to analyze
 */
export const useSafeShieldForTxData = (txData: SafeTransaction | undefined) => {
  const { setSafeTx } = useSafeShield()

  useEffect(() => {
    if (txData) {
      setSafeTx(txData)
    }
  }, [txData, setSafeTx])
}
