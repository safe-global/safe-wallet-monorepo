import { useCallback, useMemo, useState } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { getGasPaymentOptions } from '@safe-global/utils/utils/gasPaymentOptions'
import { isGtfSafePaid } from '@safe-global/utils/utils/isGtfSafePaid'
import { useCurrentChain } from '@/hooks/useChains'
import { useRelaysBySafe } from '@/hooks/useRemainingRelays'
import useWalletCanRelay from '@/hooks/useWalletCanRelay'
import { useSafeSponsoredTxs } from '@/features/spaces'
import { useGasTooHigh, useIsNoFeeCampaignEnabled, useNoFeeCampaignEligibility } from '@/features/no-fee-campaign'
import { selectSponsoredOffer, type SponsoredOffer, type SponsoredOption } from '@/utils/gasPayment'

export type GasPaymentOptions = {
  offer: SponsoredOffer | null
  showsProUpsell: boolean
  exclude: (options: SponsoredOption[]) => void
}

/** The one sponsored gas payment option to offer for this transaction, or the Pro upsell. */
export const useGasPaymentOptions = ({
  safeTx,
  isBatch = false,
}: {
  safeTx?: SafeTransaction
  isBatch?: boolean
}): GasPaymentOptions => {
  const chain = useCurrentChain()
  const [relays, , isRelaysLoading] = useRelaysBySafe()
  const { isEnabled, isPro, left, meter, spaceId, isLoading: isProLoading } = useSafeSponsoredTxs()
  const campaign = useNoFeeCampaignEligibility()
  const isCampaignEnabled = useIsNoFeeCampaignEnabled()
  const isGasTooHigh = !!useGasTooHigh(safeTx)
  const [walletCanRelay, , isWalletCheckLoading] = useWalletCanRelay(isBatch ? undefined : safeTx)
  const [excluded, setExcluded] = useState<ReadonlySet<SponsoredOption>>(new Set())

  // A batch sends no gas estimate, so the campaign's gas cap cannot be enforced on it.
  const chainOptions = useMemo(
    () => getGasPaymentOptions(chain).filter((option) => !isBatch || option !== 'NO_FEE_CAMPAIGN'),
    [chain, isBatch],
  )
  const isRefundTx = !!safeTx && isGtfSafePaid(safeTx.data)
  const canWalletRelay = isBatch || walletCanRelay === true
  const isCampaignEligible = !!isCampaignEnabled && !!campaign.isEligible && !campaign.blockedAddress

  const { offer, showsProUpsell } = useMemo(
    () =>
      selectSponsoredOffer({
        chainOptions,
        isRefundTx,
        walletCanRelay: canWalletRelay,
        campaign: {
          isEligible: isCampaignEligible,
          remaining: campaign.remaining ?? 0,
          limit: campaign.limit ?? 0,
          isGasTooHigh,
        },
        daily: relays,
        pro: { isEnabled, isPro, left, meter, spaceId },
        excluded,
      }),
    [
      chainOptions,
      isRefundTx,
      canWalletRelay,
      isCampaignEligible,
      campaign.remaining,
      campaign.limit,
      isGasTooHigh,
      relays,
      isEnabled,
      isPro,
      left,
      meter,
      spaceId,
      excluded,
    ],
  )

  // Only a source that can still change the answer holds the offer back; Pro waits only when nothing free is on offer.
  const isSettling =
    (!isBatch && isWalletCheckLoading) ||
    (chainOptions.includes('NO_FEE_CAMPAIGN') && campaign.isLoading) ||
    (chainOptions.includes('FREE_DAILY_LIMIT') && isRelaysLoading) ||
    (chainOptions.includes('SUBSCRIPTION') && isProLoading && offer === null)

  const exclude = useCallback((options: SponsoredOption[]) => {
    setExcluded((current) => new Set([...current, ...options]))
  }, [])

  return { offer: isSettling ? null : offer, showsProUpsell: isSettling ? false : showsProUpsell, exclude }
}
