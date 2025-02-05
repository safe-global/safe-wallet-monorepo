import { useMemo } from 'react'
import { Typography, Card, SvgIcon, Grid, Button, Box, Stack, Link } from '@mui/material'
import css from './styles.module.css'
import Kiln from '@/public/images/common/kiln.svg'
import StakeIllustrationLight from '@/public/images/common/stake-illustration-light.svg'
import StakeIllustrationDark from '@/public/images/common/stake-illustration-dark.svg'
import StakeIcon from '@/public/images/common/stake.svg'
import classNames from 'classnames'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useRouter } from 'next/router'
import NextLink from 'next/link'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import ExternalLink from '@/components/common/ExternalLink'
import { useSanctionedAddress } from '@/hooks/useSanctionedAddress'
import { AppRoutes } from '@/config/routes'
import useBalances from '@/hooks/useBalances'
import { formatUnits } from 'ethers'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import useIsStakingBannerEnabled from '@/features/stake/hooks/useIsStakingBannerEnabled'

const LEARN_MORE_LINK = 'https://help.safe.global/en/articles/222615-safe-staking'
const MIN_NATIVE_TOKEN_BALANCE = 32

const StakingBanner = ({
  large = false,
  hideLocalStorageKey = 'hideStakingBanner',
}: { large?: boolean; hideLocalStorageKey?: string } = {}) => {
  const isDarkMode = useDarkMode()
  const router = useRouter()
  const { balances } = useBalances()

  const nativeTokenBalance = useMemo(
    () => balances.items.find((balance) => balance.tokenInfo.type === TokenType.NATIVE_TOKEN),
    [balances.items],
  )

  const hasSufficientFunds =
    nativeTokenBalance != null &&
    Number(formatUnits(nativeTokenBalance.balance, nativeTokenBalance.tokenInfo.decimals ?? 0)) >=
      MIN_NATIVE_TOKEN_BALANCE

  const [widgetHidden = false, setWidgetHidden] = useLocalStorage<boolean>(hideLocalStorageKey)

  const isStakingBannerEnabled = useIsStakingBannerEnabled()

  const sanctionedAddress = useSanctionedAddress(isStakingBannerEnabled && !widgetHidden)

  if (!isStakingBannerEnabled || widgetHidden || Boolean(sanctionedAddress) || !hasSufficientFunds) return null

  const onClick = () => {
    trackEvent(OVERVIEW_EVENTS.OPEN_STAKING_WIDGET)
  }

  const onHide = () => {
    setWidgetHidden(true)
    trackEvent(OVERVIEW_EVENTS.HIDE_STAKING_BANNER)
  }

  const onLearnMore = () => {
    trackEvent(OVERVIEW_EVENTS.OPEN_LEARN_MORE_STAKING_BANNER)
  }

  if (large) {
    return (
      <>
        <Card className={`${css.bannerWrapper} ${css.bannerWrapperLarge}`}>
          <Box
            sx={{
              mr: { sm: -8, md: -4, lg: 0 },
              display: { xs: 'none', sm: 'block' },
              position: 'relative',
            }}
          >
            <Box className={classNames(css.gradientShadow, { [css.gradientShadowDarkMode]: isDarkMode })} />
            <SvgIcon
              component={isDarkMode ? StakeIllustrationLight : StakeIllustrationDark}
              inheritViewBox
              className={classNames(css.stakeIllustration)}
            />
          </Box>

          <Grid container rowSpacing={2}>
            <Grid
              item
              xs={12}
              sx={{
                zIndex: 2,
                mb: 1,
              }}
            >
              <Stack spacing={0.5} direction="row">
                <Typography
                  variant="overline"
                  sx={{
                    color: 'primary.light',
                  }}
                >
                  Powered by
                </Typography>
                <SvgIcon
                  component={Kiln}
                  inheritViewBox
                  color="border"
                  className={classNames(css.kilnIcon, { [css.kilnIconDarkMode]: isDarkMode })}
                />
              </Stack>
            </Grid>

            <Grid
              item
              xs={12}
              sx={{
                zIndex: 2,
              }}
            >
              <Typography
                variant="h2"
                className={classNames(css.header, { [css.gradientText]: isDarkMode })}
                sx={{
                  fontWeight: 700,
                }}
              >
                Stake your ETH and earn rewards
              </Typography>
            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
              sx={{
                zIndex: 2,
                mb: 1,
              }}
            >
              <Typography variant="body1">
                Lock 32 ETH and become a validator easily with the Kiln widget — faster and more cost-effective. You can
                also explore Safe Apps or home staking for other options. Staking involves risks like slashing.
              </Typography>
              {LEARN_MORE_LINK && (
                <ExternalLink onClick={onLearnMore} href={LEARN_MORE_LINK}>
                  Learn more
                </ExternalLink>
              )}
            </Grid>

            <Grid
              item
              container
              xs={12}
              spacing={2}
              sx={{
                textAlign: 'center',
              }}
            >
              <Grid item xs={12} md="auto">
                <NextLink
                  href={AppRoutes.stake && { pathname: AppRoutes.stake, query: { safe: router.query.safe } }}
                  passHref
                  rel="noreferrer"
                  onClick={onClick}
                >
                  <Button fullWidth variant="contained">
                    Stake ETH
                  </Button>
                </NextLink>
              </Grid>
              <Grid item xs={12} md="auto">
                <Button variant="text" onClick={onHide}>
                  Don&apos;t show again
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Card>
      </>
    )
  }

  return (
    <>
      <Card className={css.bannerWrapper}>
        {!isDarkMode && <Box className={classNames(css.gradientBackground)} />}

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{
            alignItems: { xs: 'initial', md: 'center' },
            justifyContent: 'space-between',
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <SvgIcon component={StakeIcon} sx={{ width: '16px', height: '16px' }} inheritViewBox />

            <Typography variant="body2">
              <strong>Stake ETH and earn rewards up to 5% APY.</strong> Lock 32 ETH to become a validator via the Kiln
              widget. You can also{' '}
              <NextLink
                href={{ pathname: AppRoutes.apps.index, query: { ...router.query, categories: ['Staking'] } }}
                passHref
                type="link"
              >
                <Link>explore Safe Apps</Link>
              </NextLink>{' '}
              and home staking for other options. Staking involves risks like slashing.
              {LEARN_MORE_LINK && (
                <>
                  {' '}
                  <ExternalLink onClick={onLearnMore} href={LEARN_MORE_LINK}>
                    Learn more
                  </ExternalLink>
                </>
              )}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{
              alignItems: { xs: 'center', md: 'flex-end' },
            }}
          >
            <Box>
              <Button variant="text" onClick={onHide} size="small" sx={{ whiteSpace: 'nowrap' }}>
                Don&apos;t show again
              </Button>
            </Box>
            <NextLink
              href={AppRoutes.stake && { pathname: AppRoutes.stake, query: { safe: router.query.safe } }}
              passHref
              rel="noreferrer"
              onClick={onClick}
              className={classNames(css.stakeButton)}
            >
              <Button fullWidth size="small" variant="contained">
                Stake
              </Button>
            </NextLink>
          </Stack>
        </Stack>
      </Card>
    </>
  )
}

export default StakingBanner
