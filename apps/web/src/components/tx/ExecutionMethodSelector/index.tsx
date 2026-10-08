import type { Dispatch, SetStateAction, ReactElement } from 'react'
import useWallet from '@/hooks/wallets/useWallet'
import SponsoredBy from '../SponsoredBy'

import RemainingRelays from '../RemainingRelays'
import SponsoredTxsCounter from '../SponsoredTxsCounter'
import { NoFeeCampaignFeature } from '@/features/no-fee-campaign'
import { useLoadFeature } from '@/features/__core__'

import BalanceInfo from '@/components/tx/BalanceInfo'
import madProps from '@/utils/mad-props'
import { useCurrentChain } from '@/hooks/useChains'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import type { SponsoredOffer } from '@/utils/gasPayment'
import {
  ExecutionMethodSelectorView,
  ExecutionMethodUpsellView,
  NoFeeCampaignCounterView,
} from '@views/components/tx/ExecutionMethodSelector/ExecutionMethodSelectorView'

export const enum ExecutionMethod {
  RELAY = 'RELAY',
  WALLET = 'WALLET',
}

// Wrapper component to load GasTooHighBanner (follows React naming conventions)
const GasTooHighBannerLoader = () => {
  const { GasTooHighBanner } = useLoadFeature(NoFeeCampaignFeature)
  return <GasTooHighBanner />
}

const SponsoredStrip = ({
  offer,
  isRelay,
  isSafeProEnabled,
  hasWallet,
  tooltip,
}: {
  offer: SponsoredOffer
  isRelay: boolean
  isSafeProEnabled: boolean
  hasWallet: boolean
  tooltip?: string
}): ReactElement | null => {
  const balance = hasWallet ? <BalanceInfo /> : null

  switch (offer.option) {
    case 'NO_FEE_CAMPAIGN':
      return isRelay ? <NoFeeCampaignCounterView remaining={offer.remaining} /> : balance
    case 'FREE_DAILY_LIMIT':
      if (!offer.relays) return balance
      if (isSafeProEnabled) {
        return (
          <SponsoredTxsCounter
            left={offer.relays.remaining}
            quota={offer.relays.limit}
            resetsAt={null}
            isSubscription={false}
            isPro={offer.isPro}
          />
        )
      }
      return isRelay ? <RemainingRelays relays={offer.relays} tooltip={tooltip} /> : balance
    case 'SUBSCRIPTION':
      return (
        <SponsoredTxsCounter
          left={offer.left}
          quota={offer.meter?.quota ?? null}
          resetsAt={offer.meter?.resetsAt ?? null}
          isSubscription
          isPro
        />
      )
  }
}

export const _ExecutionMethodSelector = ({
  wallet,
  chain,
  isSafeProEnabled,
  executionMethod,
  setExecutionMethod,
  offer,
  showsProUpsell,
  noLabel,
  tooltip,
}: {
  wallet: ConnectedWallet | null
  chain?: Chain
  isSafeProEnabled: boolean
  executionMethod: ExecutionMethod
  setExecutionMethod: Dispatch<SetStateAction<ExecutionMethod>>
  offer: SponsoredOffer | null
  /** No sponsored option is left, but a Safe Pro plan would sponsor this Safe: only the upgrade nudge renders. */
  showsProUpsell?: boolean
  noLabel?: boolean
  tooltip?: string
}): ReactElement | null => {
  const selectedMethod = offer && !offer.disabledReason ? executionMethod : ExecutionMethod.WALLET

  const onChooseExecutionMethod = (newExecutionMethod: unknown) => {
    setExecutionMethod(newExecutionMethod as ExecutionMethod)
  }

  if (!offer) {
    if (!showsProUpsell) return null
    return (
      <ExecutionMethodUpsellView
        counter={<SponsoredTxsCounter left={0} quota={null} resetsAt={null} isSubscription={false} isPro={false} />}
      />
    )
  }

  return (
    <ExecutionMethodSelectorView
      offer={offer}
      wallet={wallet}
      selectedMethod={selectedMethod}
      onChooseExecutionMethod={onChooseExecutionMethod}
      noLabel={noLabel}
      sponsoredBy={
        offer.option !== 'NO_FEE_CAMPAIGN' ? <SponsoredBy option={offer.option} chainId={chain?.chainId ?? ''} /> : null
      }
      gasTooHighBanner={<GasTooHighBannerLoader />}
      strip={
        <SponsoredStrip
          offer={offer}
          isRelay={selectedMethod === ExecutionMethod.RELAY}
          isSafeProEnabled={isSafeProEnabled}
          hasWallet={!!wallet}
          tooltip={tooltip}
        />
      }
    />
  )
}

export const ExecutionMethodSelector = madProps(_ExecutionMethodSelector, {
  wallet: useWallet,
  chain: useCurrentChain,
  isSafeProEnabled: useIsSafeProEnabled,
})
