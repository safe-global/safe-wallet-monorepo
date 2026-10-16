import { useContext } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { isGtfFeePreviewAvailable } from '../utils/isGtfFeePreviewAvailable'

/**
 * Spec §4: when the fee is paid from the Safe, the signature that reaches the threshold can sign and
 * execute in one click — the relayer executes right after it, no gas needed from the signer. True for
 * that signature only: Pay from Safe chosen (or already locked in the payload) and one signature short.
 */
export const useIsPayFromSafeSignAndExecute = (): boolean => {
  const chain = useCurrentChain()
  const { safe } = useSafeInfo()
  const { safeTx, gtfPaymentMode, gtfSelectedGasToken } = useContext(SafeTxContext)
  if (!safeTx || !isGtfFeePreviewAvailable(chain)) return false
  const reachesThreshold = safeTx.signatures.size === Math.max(safe.threshold - 1, 0)
  const paysFromSafe = gtfPaymentMode === 'safe' && !!gtfSelectedGasToken
  return reachesThreshold && paysFromSafe
}
