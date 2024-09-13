import TokenAmount from '@/components/common/TokenAmount'
import Track from '@/components/common/Track'
import QrCodeButton from '@/components/sidebar/QrCodeButton'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { formatCurrency } from '@/utils/formatNumber'
import { useContext, useMemo, type ReactElement } from 'react'
import { Button, Grid, Skeleton, Typography } from '@mui/material'
import { WidgetBody, WidgetContainer } from '../styled'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'

import ArrowIconSE from '@/public/images/common/arrow-se.svg'
import BuyCryptoButton from '@/components/common/BuyCryptoButton'
import { selectCurrentSuperChainAccount } from '@/store/superChainAccountSlice'

const SkeletonOverview = (
  <>
    <Grid container pb={2} mt={3} gap={2} alignItems="flex-end" justifyContent="space-between">
      <Grid item>
        <Skeleton variant="text" width={100} height={30} />
        <Skeleton variant="rounded" width={160} height={40} />
      </Grid>

      <Grid item>
        <Grid container gap={1} flexWrap="wrap">
          <Skeleton variant="rounded" width="115px" height="40px" />
          <Skeleton variant="rounded" width="115px" height="40px" />
        </Grid>
      </Grid>
    </Grid>
  </>
)

const Overview = (): ReactElement => {
  const currency = useAppSelector(selectCurrency)
  const { safe, safeLoading, safeLoaded } = useSafeInfo()
  const { balances, loading: balancesLoading } = useVisibleBalances()
  const { setTxFlow } = useContext(TxModalContext)
  const data = useAppSelector(selectCurrentSuperChainAccount)

  const fiatTotal = useMemo(
    () => (balances.fiatTotal ? formatCurrency(balances.fiatTotal, currency) : ''),
    [currency, balances.fiatTotal],
  )

  const isInitialState = !safeLoaded && !safeLoading
  const isLoading = safeLoading || balancesLoading || isInitialState

  const handleOnSend = () => {
    setTxFlow(<NewTxFlow />, undefined, false)
    trackEvent(OVERVIEW_EVENTS.NEW_TRANSACTION)
  }

  return (
    <WidgetContainer>
      <WidgetBody>
        {isLoading ? (
          SkeletonOverview
        ) : (
          <>
            <Grid container pb={2} mt={3} gap={2} alignItems="flex-end" justifyContent="space-between">
              <Grid item xs={6}>
                <Typography color="primary.light" fontWeight="bold" mb={1}>
                  Total asset value
                </Typography>
                <Typography component="div" variant="h1" fontSize={44} lineHeight="40px">
                  {safe.deployed ? (
                    fiatTotal
                  ) : (
                    <TokenAmount
                      value={balances.items[0].balance}
                      decimals={balances.items[0].tokenInfo.decimals}
                      tokenSymbol={balances.items[0].tokenInfo.symbol}
                    />
                  )}
                </Typography>
              </Grid>

              <Grid item xs={5} alignItems="flex-end" sm="auto">
                <QrCodeButton>
                  <Button size="small" variant="outlined" color="primary" startIcon={<ArrowIconSE />} fullWidth>
                    Receive
                  </Button>
                </QrCodeButton>
              </Grid>
            </Grid>
          </>
        )}
      </WidgetBody>
    </WidgetContainer>
  )
}

export default Overview
