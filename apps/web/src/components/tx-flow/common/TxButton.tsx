import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, type ButtonProps } from '@mui/material'

import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { AppRoutes } from '@/config/routes'
import Track from '@/components/common/Track'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { GA_LABEL_TO_MIXPANEL_PROPERTY } from '@/services/analytics/ga-mixpanel-mapping'
import { useContext } from 'react'
import { TxModalContext } from '..'
import SwapIcon from '@/public/images/common/swap.svg'
import AssetsIcon from '@/public/images/sidebar/assets.svg'
import useIsSwapFeatureEnabled from '@/features/swap/hooks/useIsSwapFeatureEnabled'

const buttonSx = {
  '& svg path': { fill: 'currentColor' },
}

export const SendTokensButton = ({ onClick, sx }: { onClick: () => void; sx?: ButtonProps['sx'] }) => {
  return (
    <Track {...MODALS_EVENTS.SEND_FUNDS}>
      <Button
        data-testid="send-tokens-btn"
        onClick={onClick}
        variant="contained"
        size="xlarge"
        sx={sx ?? buttonSx}
        fullWidth
        startIcon={<AssetsIcon width={20} />}
      >
        Send tokens
      </Button>
    </Track>
  )
}

export const TxBuilderButton = () => {
  const txBuilder = useTxBuilderApp()
  const router = useRouter()
  const { setTxFlow } = useContext(TxModalContext)

  const isTxBuilder = typeof txBuilder.link.query === 'object' && router.query.appUrl === txBuilder.link.query?.appUrl
  const onClick = isTxBuilder ? () => setTxFlow(undefined) : undefined

  return (
    <Track {...MODALS_EVENTS.CONTRACT_INTERACTION}>
      <Link href={txBuilder.link} passHref style={{ width: '100%' }}>
        <Button
          variant="outlined"
          size="xlarge"
          sx={buttonSx}
          fullWidth
          onClick={onClick}
          startIcon={<img src="/images/apps/tx-builder.png" height={24} width="auto" alt="Transaction Builder" />}
        >
          Transaction Builder
        </Button>
      </Link>
    </Track>
  )
}

export const MakeASwapButton = () => {
  const router = useRouter()
  const { setTxFlow } = useContext(TxModalContext)
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
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
        query: { safe: router.query.safe },
      })
    }
  }

  return (
    <Button
      variant="contained"
      size="xlarge"
      sx={buttonSx}
      fullWidth
      startIcon={<SwapIcon width={20} />}
      onClick={onClick}
    >
      Swap tokens
    </Button>
  )
}
