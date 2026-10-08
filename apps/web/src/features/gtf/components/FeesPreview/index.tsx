import type { ReactElement } from 'react'
import { useContext } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import type { GtfPaymentMode } from '@/features/gtf/types'
import type { FeesPreviewData } from '../../hooks/useFeesPreview'
import { IS_RELAYING_LIVE } from '../../constants'
import { FeesPreviewView } from '@views/features/gtf/components/FeesPreview/FeesPreviewView'

const FeesPreview = (props: FeesPreviewData): ReactElement => {
  const { canCoverFees, isConfirmation, isLegacySigned, totalOutgoing, availableGasTokens } = props
  const { gtfPaymentMode, setGtfPaymentMode } = useContext(SafeTxContext)
  const chain = useCurrentChain()
  const currency = useAppSelector(selectCurrency)
  const nativeDisplay = {
    symbol: chain?.nativeCurrency.symbol ?? '',
    logoUri: chain?.nativeCurrency.logoUri ?? '',
  }

  // No eligible gas token in the Safe → Safe-pays isn't actually an option for this tx. Lock the UI
  // to signer-pays so the dropdown isn't shown empty and the user can't pick "Safe" expecting it to
  // work (PLA-1435). The hook already routes to signer-pays internally (canCoverFees stays true), so
  // this only overrides the rendering.
  const noEligibleGasToken =
    !isConfirmation && !isLegacySigned && (availableGasTokens?.length ?? 0) === 0 && canCoverFees

  // Relaying hidden: only a payload signed before the switch still pays from the Safe.
  const isSafeWallet =
    (IS_RELAYING_LIVE ? gtfPaymentMode === 'safe' : !!isConfirmation && !isLegacySigned && canCoverFees) &&
    !noEligibleGasToken
  const displayedOutgoing = totalOutgoing && !isSafeWallet ? { ...totalOutgoing, fees: undefined } : totalOutgoing

  const handlePaymentSourceChange = (source: GtfPaymentMode) => {
    setGtfPaymentMode(source)
    if (source === 'signer') {
      const nativeAddress = availableGasTokens?.[0]?.address
      if (nativeAddress) props.onGasTokenChange?.(nativeAddress)
    }
  }

  return (
    <FeesPreviewView
      {...props}
      isRelayingLive={IS_RELAYING_LIVE}
      gtfPaymentMode={gtfPaymentMode}
      onPaymentSourceChange={handlePaymentSourceChange}
      nativeCurrency={chain?.nativeCurrency}
      nativeDisplay={nativeDisplay}
      currency={currency}
      noEligibleGasToken={noEligibleGasToken}
      isSafeWallet={isSafeWallet}
      displayedOutgoing={displayedOutgoing}
    />
  )
}

export default FeesPreview
