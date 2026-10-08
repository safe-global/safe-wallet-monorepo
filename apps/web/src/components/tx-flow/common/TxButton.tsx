import { useRouter } from 'next/router'

import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { GA_LABEL_TO_MIXPANEL_PROPERTY } from '@/services/analytics/ga-mixpanel-mapping'
import { useContext } from 'react'
import { TxModalContext } from '..'
import { useIsSwapFeatureEnabled } from '@/features/swap'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import {
  MakeASwapButtonView,
  SendTokensButtonView,
  TxBuilderButtonView,
} from '@views/components/tx-flow/common/TxButtonView'

export const SendTokensButton = ({ onClick }: { onClick: () => void; sx?: object }) => {
  return <SendTokensButtonView onClick={onClick} />
}

export const TxBuilderButton = () => {
  const txBuilder = useTxBuilderApp()
  const router = useRouter()
  const { setTxFlow } = useContext(TxModalContext)

  const isTxBuilder = typeof txBuilder.link.query === 'object' && router.query.appUrl === txBuilder.link.query?.appUrl
  const onClick = isTxBuilder ? () => setTxFlow(undefined) : undefined

  return <TxBuilderButtonView href={txBuilder.link} onClick={onClick} />
}

export const MakeASwapButton = () => {
  const router = useRouter()
  const { setTxFlow } = useContext(TxModalContext)
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const safeLinkQuery = useSafeLinkQuery()
  if (!isSwapFeatureEnabled) return null

  const isSwapPage = router.pathname === AppRoutes.swap

  const onClick = () => {
    trackEvent(
      { ...SWAP_EVENTS.OPEN_SWAPS, label: SWAP_LABELS.newTransaction },
      {
        [MixpanelEventParams.ENTRY_POINT]: GA_LABEL_TO_MIXPANEL_PROPERTY[SWAP_LABELS.newTransaction],
      },
    )

    if (isSwapPage) {
      setTxFlow(undefined)
    } else {
      setTxFlow(undefined)
      router.push({
        pathname: AppRoutes.swap,
        query: safeLinkQuery,
      })
    }
  }

  return <MakeASwapButtonView onClick={onClick} />
}
