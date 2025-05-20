import { Typography, Card, SvgIcon, Grid2 as Grid, Button, Box, Stack } from '@mui/material'
import css from './styles.module.css'
import Kiln from '@/public/images/common/kiln.svg'
import Morpho from '@/public/images/common/morpho.svg'
import EarnIllustrationLight from '@/public/images/common/earn-illustration-light.png'
import classNames from 'classnames'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useRouter } from 'next/router'
import NextLink from 'next/link'
import { AppRoutes } from '@/config/routes'
import Image from 'next/image'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import useIsEarnBannerEnabled from '@/features/earn/hooks/useIsEarnBannerEnabled'
import Track from '@/components/common/Track'
import { EARN_EVENTS, EARN_LABELS } from '@/services/analytics/events/earn'

export const EarnPoweredBy = () => {
  const isDarkMode = useDarkMode()

  return (
    <Stack spacing={1} direction="row">
      <Typography variant="overline" color="primary.light">
        Powered by
      </Typography>
      <SvgIcon
        component={Morpho}
        inheritViewBox
        color="border"
        className={classNames(css.morphoIcon, { [css.kilnIconDarkMode]: isDarkMode })}
      />
      <SvgIcon
        component={Kiln}
        inheritViewBox
        color="border"
        className={classNames(css.kilnIcon, { [css.kilnIconDarkMode]: isDarkMode })}
      />
    </Stack>
  )
}

const hideLocalStorageKey = 'hideEarnDashboardBanner'

const EarnDashboardBanner = () => {
  const [widgetHidden = false, setWidgetHidden] = useLocalStorage<boolean>(hideLocalStorageKey)

  const isDarkMode = useDarkMode()
  const router = useRouter()
  const isEarnBannerEnabled = useIsEarnBannerEnabled()

  const tryEarn = () => {
    trackEvent(OVERVIEW_EVENTS.OPEN_EARN_WIDGET)
  }

  const hideEarn = () => {
    setWidgetHidden(true)
    trackEvent(OVERVIEW_EVENTS.HIDE_EARN_BANNER)
  }

  if (!isEarnBannerEnabled || widgetHidden) return null

  return (
    <Card className={css.bannerWrapper}>
      <Box mr={{ sm: -8, md: -4, lg: 0 }} display={{ xs: 'none', sm: 'block' }} position="relative">
        <Box className={classNames(css.gradientShadow, { [css.gradientShadowDarkMode]: isDarkMode })} />
        <Image
          className={css.earnIllustration}
          src={EarnIllustrationLight}
          alt="Earn illustration"
          width={239}
          height={239}
        />
      </Box>

      <Grid container rowSpacing={2}>
        <Grid size={{ xs: 12 }} mb={1} zIndex={2}>
          <EarnPoweredBy />
        </Grid>

        <Grid size={{ xs: 12 }} zIndex={2}>
          <Typography variant="h2" className={classNames(css.header, { [css.gradientText]: isDarkMode })}>
            Introducing enterprise-grade yields for treasuries via Morpho
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }} mb={1} zIndex={2}>
          <Typography variant="body1" className={css.content}>
            Deposit stablecoins, wstETH, ETH, and WBTC straight from your account and let your assets compound in
            minutes.
          </Typography>
        </Grid>

        <Grid container size={{ xs: 12 }} textAlign="center" spacing={2}>
          <Grid size={{ xs: 12, md: 'auto' }}>
            <Track {...EARN_EVENTS.OPEN_EARN_PAGE} label={EARN_LABELS.safe_dashboard_banner}>
              <NextLink
                href={AppRoutes.earn && { pathname: AppRoutes.earn, query: { safe: router.query.safe } }}
                passHref
                rel="noreferrer"
                onClick={tryEarn}
              >
                <Button fullWidth variant="contained">
                  Try now
                </Button>
              </NextLink>
            </Track>
          </Grid>
          <Grid size={{ xs: 12, md: 'auto' }}>
            <Track {...EARN_EVENTS.HIDE_EARN_BANNER}>
              <Button variant="text" onClick={hideEarn}>
                Don&apos;t show again
              </Button>
            </Track>
          </Grid>
        </Grid>
      </Grid>
    </Card>
  )
}

export default EarnDashboardBanner
