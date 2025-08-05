import BuyCryptoButton from '@/components/common/BuyCryptoButton'
import TokenAmount from '@/components/common/TokenAmount'
import Track from '@/components/common/Track'
import QrCodeButton from '@/components/sidebar/QrCodeButton'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'
import SwapIcon from '@/public/images/common/swap.svg'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import Link from 'next/link'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import ArrowIconNW from '@/public/images/common/arrow-top-right.svg'
import ArrowIconSE from '@/public/images/common/arrow-se.svg'
import FiatValue from '@/components/common/FiatValue'
import { AppRoutes } from '@/config/routes'
import { Button, Card, Box, Skeleton, Typography, Stack, SvgIcon } from '@mui/material'
import { useRouter } from 'next/router'
import { type ReactElement, useContext, useMemo } from 'react'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import useIsSwapFeatureEnabled from '@/features/swap/hooks/useIsSwapFeatureEnabled'
import NewsCarousel, { type BannerItem } from '@/components/dashboard/NewsCarousel'
import EarnBanner, { earnBannerID } from '@/components/dashboard/NewsCarousel/banners/EarnBanner'
import SpacesBanner, { spacesBannerID } from '@/components/dashboard/NewsCarousel/banners/SpacesBanner'
import useIsEarnFeatureEnabled from '@/features/earn/hooks/useIsEarnFeatureEnabled'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import FiatIcon from '@/public/images/common/fiat2.svg'
import CopyIcon from '@/public/images/common/copy.svg'
import CopyTooltip from '@/components/common/CopyTooltip'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import useSafeAddress from '@/hooks/useSafeAddress'
import StakeBanner, { stakeBannerID } from '@/components/dashboard/NewsCarousel/banners/StakeBanner'
import useIsStakingBannerVisible from '@/components/dashboard/StakingBanner/useIsStakingBannerVisible'

const AddFundsToGetStarted = () => {
  const { safe } = useSafeInfo()
  const safeAddress = useSafeAddress()
  const settings = useAppSelector(selectSettings)
  const chain = useCurrentChain()

  const addressCopyText = settings.shortName.copy && chain ? `${chain.shortName}:${safeAddress}` : safeAddress

  if (!safe.deployed) return null

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{ backgroundColor: 'info.light' }}
      p={2}
      gap={2}
      alignItems={{ xs: 'flex-start', md: 'center' }}
      borderRadius={1}
      mt={3}
    >
      <Box
        width="40px"
        height="40px"
        bgcolor="background.paper"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="6px"
        flexShrink="0"
      >
        <SvgIcon component={FiatIcon} inheritViewBox fontSize="small" />
      </Box>
      <Box>
        <Typography fontWeight="bold" color="static.main">
          Add funds to get started
        </Typography>
        <Typography variant="body2" color="primary.light">
          Onramp crypto or send tokens directly to your address from a different wallet.{' '}
        </Typography>
      </Box>
      <Box ml={{ xs: 0, md: 'auto' }}>
        <CopyTooltip text={addressCopyText}>
          <Button
            variant="contained"
            color="background.paper"
            startIcon={<SvgIcon component={CopyIcon} inheritViewBox fontSize="small" />}
            size="small"
            disableElevation
          >
            Copy address
          </Button>
        </CopyTooltip>
      </Box>
    </Stack>
  )
}

const Overview = (): ReactElement => {
  const { safe, safeLoading, safeLoaded } = useSafeInfo()
  const { balances, loading: balancesLoading } = useVisibleBalances()
  const { setTxFlow } = useContext(TxModalContext)
  const router = useRouter()
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const isEarnFeatureEnabled = useIsEarnFeatureEnabled()
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  const isStakingBannerVisible = useIsStakingBannerVisible()

  const banners = [
    isEarnFeatureEnabled && { id: earnBannerID, element: EarnBanner },
    isSpacesFeatureEnabled && { id: spacesBannerID, element: SpacesBanner },
    isStakingBannerVisible && { id: stakeBannerID, element: StakeBanner },
  ].filter(Boolean) as BannerItem[]

  const isInitialState = !safeLoaded && !safeLoading
  const isLoading = safeLoading || balancesLoading || isInitialState

  const handleOnSend = () => {
    setTxFlow(<NewTxFlow />, undefined, false)
    trackEvent(OVERVIEW_EVENTS.NEW_TRANSACTION)
  }

  const items = useMemo(() => {
    return balances.items.filter((item) => item.balance !== '0')
  }, [balances.items])

  const noAssets = !balancesLoading && items.length === 0

  if (isLoading) return <Skeleton height={269} variant="rounded" />

  return (
    <Card sx={{ border: 0, p: 3 }} component="section">
      <Box>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography color="primary.light" fontWeight="bold" mb={1}>
              Total asset value
            </Typography>
            <Typography component="div" variant="h1" fontSize="44px" lineHeight="40px">
              {safe.deployed ? (
                <FiatValue value={balances.fiatTotal} maxLength={20} precise />
              ) : (
                <TokenAmount
                  value={balances.items[0]?.balance}
                  decimals={balances.items[0]?.tokenInfo.decimals}
                  tokenSymbol={balances.items[0]?.tokenInfo.symbol}
                />
              )}
            </Typography>
          </Box>

          {safe.deployed && (
            <Stack
              direction="row"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              flexWrap={{ xs: 'wrap', md: 'nowrap' }}
              gap={1}
              width={{ xs: 1, md: 'auto' }}
              mt={{ xs: 2, md: 0 }}
            >
              {!noAssets && (
                <Box flex={1}>
                  <Button
                    onClick={handleOnSend}
                    size="compact"
                    variant="contained"
                    disableElevation
                    startIcon={<ArrowIconNW fontSize="small" />}
                    sx={{ height: '42px' }}
                    fullWidth
                  >
                    Send
                  </Button>
                </Box>
              )}

              {isSwapFeatureEnabled && !noAssets && (
                <Box flex={1}>
                  <Track {...SWAP_EVENTS.OPEN_SWAPS} label={SWAP_LABELS.dashboard}>
                    <Link href={{ pathname: AppRoutes.swap, query: router.query }} passHref type="button">
                      <Button
                        data-testid="overview-swap-btn"
                        size="compact"
                        variant="contained"
                        color="background"
                        disableElevation
                        startIcon={<SwapIcon fontSize="small" />}
                        sx={{ height: '42px' }}
                        fullWidth
                      >
                        Swap
                      </Button>
                    </Link>
                  </Track>
                </Box>
              )}

              <Box flexShrink="0" width={{ xs: 1, md: 'auto' }}>
                <BuyCryptoButton />
              </Box>

              <Box flex={1}>
                <Track {...OVERVIEW_EVENTS.SHOW_QR} label="dashboard">
                  <QrCodeButton>
                    <Button
                      size="compact"
                      variant="contained"
                      color="background"
                      disableElevation
                      startIcon={<ArrowIconSE fontSize="small" />}
                      sx={{ height: '42px' }}
                      fullWidth
                    >
                      Receive
                    </Button>
                  </QrCodeButton>
                </Track>
              </Box>
            </Stack>
          )}
        </Stack>
      </Box>

      {noAssets ? <AddFundsToGetStarted /> : <NewsCarousel banners={banners} />}
    </Card>
  )
}

export default Overview
