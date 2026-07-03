import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isAddress } from 'ethers'
import { OperationType } from '@safe-global/types-kit'
import useBalances from '@/hooks/useBalances'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender'
import { SAFE_SHIELD_EVENTS, trackEvent } from '@/services/analytics'
import {
  ENHANCED_MODE_BALANCE_THRESHOLD,
  ENHANCED_MODE_FEE_RECIPIENT,
  ENHANCED_MODE_FEE_WEI,
  ENHANCED_MODE_PRICE_LABEL,
  IS_ENHANCED_MODE_ENABLED,
} from '../constants'

export type EnhancedModePaywall = {
  price: string
  onUnlock: () => void
}

/**
 * Willingness-to-pay experiment: locks the Safe Shield analysis details behind a
 * "Run enhanced mode" overlay for low-value Safes (fiat balance below the threshold).
 *
 * On unlock, the disclosed fee is batched into the transaction being reviewed as an
 * extra native transfer to the Safe Labs fee recipient, so it is paid on execution
 * with the same signature. The paywall fails open: while balances are loading, when
 * no fee recipient is configured, or when the fee cannot be batched (already signed
 * or delegatecall transactions), the copilot renders as usual / no fee is added.
 *
 * @returns The paywall state while locked, or `undefined` when the copilot should render as usual
 */
export const useEnhancedModePaywall = (): EnhancedModePaywall | undefined => {
  const { balances, loaded } = useBalances()
  const { safeTx, setSafeTx, setSafeTxError, isReadOnly } = useContext(SafeTxContext)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isFeeAdded, setIsFeeAdded] = useState(false)

  const fiatTotal = Number(balances.fiatTotal)
  const isEligible =
    IS_ENHANCED_MODE_ENABLED &&
    isAddress(ENHANCED_MODE_FEE_RECIPIENT) &&
    loaded &&
    Number.isFinite(fiatTotal) &&
    fiatTotal < ENHANCED_MODE_BALANCE_THRESHOLD

  const onUnlock = useCallback(() => {
    setIsUnlocked(true)
    trackEvent(SAFE_SHIELD_EVENTS.ENHANCED_MODE_CONFIRMED)
  }, [])

  // Batch the fee into the reviewed transaction once it is available.
  // MultiSendCallOnly cannot wrap delegatecalls and signed transactions must not be mutated.
  useEffect(() => {
    if (!isUnlocked || isFeeAdded || !safeTx || isReadOnly) return
    if (safeTx.data.operation !== OperationType.Call) return

    setIsFeeAdded(true)

    const { to, value, data } = safeTx.data
    createMultiSendCallOnlyTx([
      { to, value, data },
      { to: ENHANCED_MODE_FEE_RECIPIENT, value: ENHANCED_MODE_FEE_WEI, data: '0x' },
    ])
      .then(setSafeTx)
      .catch(setSafeTxError)
  }, [isUnlocked, isFeeAdded, safeTx, isReadOnly, setSafeTx, setSafeTxError])

  return useMemo(
    () => (isEligible && !isUnlocked ? { price: ENHANCED_MODE_PRICE_LABEL, onUnlock } : undefined),
    [isEligible, isUnlocked, onUnlock],
  )
}
