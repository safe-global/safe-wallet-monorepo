import { createContext, useContext, useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { SafeTransaction } from '@safe-global/types-kit'
import type {
  ContractAnalysisResults,
  ThreatAnalysisResults,
  RecipientAnalysisResults,
  DeadlockAnalysisResults,
  SafeAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'

type SafeShieldContextType = {
  setRecipientAddresses: Dispatch<SetStateAction<string[] | undefined>>
  setPoisoningAddresses: Dispatch<SetStateAction<string[] | undefined>>
  setSafeTx: Dispatch<SetStateAction<SafeTransaction | undefined>>
  safeTx?: SafeTransaction
  recipient: AsyncResult<RecipientAnalysisResults>
  contract: AsyncResult<ContractAnalysisResults>
  threat: AsyncResult<ThreatAnalysisResults>
  deadlock: AsyncResult<DeadlockAnalysisResults>
  needsRiskConfirmation: boolean
  isRiskConfirmed: boolean
  setIsRiskConfirmed: Dispatch<SetStateAction<boolean>>
  // Safe-level analysis (untrusted Safe check)
  safeAnalysis: SafeAnalysisResult | null
  addToTrustedList: () => void
  /** Recipient/counterparty analysis and simulation are Safe Pro features; threat analysis (Blockaid) always runs. */
  hasProFeatures: boolean
  isSafePro: boolean
  isOffchainMessage: boolean
}

export const SafeShieldContext = createContext<SafeShieldContextType | null>(null)

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
 * Register addresses for the address-poisoning check only (no recipient analysis).
 *
 * For tx-flows whose address is not a transfer recipient (add owner, recovery setup,
 * spending-limit beneficiary, signers, …): a matched address surfaces in the Copilot recipient
 * card with just the ADDRESS_POISONING state.
 *
 * The registration lives as long as the provider, i.e. the flow. It is not cleared on unmount:
 * the registering step unmounts on Next, and the review step must keep the card.
 *
 * Keys on the joined VALUE, not array identity — RHF's watch() mutates its array in place.
 * @param addresses - Addresses to check against the user's trusted anchors (undefined entries are dropped)
 */
export const useSafeShieldForAddressPoisoning = (addresses: Array<string | undefined>) => {
  const { setPoisoningAddresses, recipient } = useSafeShield()
  const key = addresses.filter(Boolean).join(',')

  useEffect(() => {
    setPoisoningAddresses(key ? key.split(',') : undefined)
  }, [key, setPoisoningAddresses])

  return recipient
}

/**
 * Hook to register transaction data for Safe Shield analysis
 * @param txData - Transaction data to analyze
 */
export const useSafeShieldForTxData = (txData: SafeTransaction | undefined) => {
  const { setSafeTx } = useSafeShield()

  // Callers may pass a freshly-constructed SafeTransaction every render (e.g. Pay from Safe's previewed tx).
  const lastDataKeyRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!txData) {
      if (lastDataKeyRef.current !== undefined) {
        lastDataKeyRef.current = undefined
        setSafeTx(undefined)
      }
      return
    }
    const key = JSON.stringify(txData.data)
    if (key === lastDataKeyRef.current) return
    lastDataKeyRef.current = key
    setSafeTx(txData)
  }, [txData, setSafeTx])
}
