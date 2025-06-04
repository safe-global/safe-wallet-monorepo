import { Card, Box, Grid2 as Grid, Typography, Button, SvgIcon, Stack, Tooltip } from '@mui/material'
import Image from 'next/image'
import EarnIllustrationLight from '@/public/images/common/earn-illustration-light.png'

import css from './styles.module.css'
import { EarnBannerCopy, EarnPoweredBy } from '@/features/earn/components/EarnDashboardBanner'
import CheckIcon from '@/public/images/common/check.svg'
import StarIcon from '@/public/images/common/star.svg'
import EyeIcon from '@/public/images/common/eye.svg'
import FiatIcon from '@/public/images/common/fiat.svg'
import Track from '@/components/common/Track'
import { EARN_EVENTS, EARN_LABELS } from '@/services/analytics/events/earn'
import useBalances from '@/hooks/useBalances'
import { APYDisclaimer, EligibleEarnTokens, VaultAPYs } from '@/features/earn/constants'
import useChainId from '@/hooks/useChainId'
import TokenIcon from '@/components/common/TokenIcon'
import TokenAmount from '@/components/common/TokenAmount'
import FiatValue from '@/components/common/FiatValue'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import { trackEvent } from '@/services/analytics'

const EarnInfo = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const { balances } = useBalances()
  const chainId = useChainId()
  const router = useRouter()

  const eligibleAssets = balances.items.filter((token) => EligibleEarnTokens[chainId].includes(token.tokenInfo.address))

  return (
    <Box m={3}>
      <Card sx={{ p: 4 }}>
        <Grid container spacing={3}>
          <Grid container size={{ xs: 12, md: 7 }} rowSpacing={3}>
            <Grid size={{ xs: 12 }} zIndex={2}>
              <EarnPoweredBy />
            </Grid>

            <Grid size={{ xs: 12 }} zIndex={2} maxWidth={600}>
              <EarnBannerCopy />
            </Grid>

            <Grid container size={{ xs: 12 }} textAlign="center" spacing={2}>
              <Grid size={{ xs: 12, md: 'auto' }}>
                <Track {...EARN_EVENTS.GET_STARTED_WITH_EARN}>
                  <Button fullWidth variant="contained" onClick={onGetStarted}>
                    Get started
                  </Button>
                </Track>
              </Grid>
            </Grid>
          </Grid>

          <Grid
            size={{ xs: 12, md: 5 }}
            display={{ xs: 'none', sm: 'flex' }}
            position="relative"
            sx={{ backgroundColor: 'background.main', alignItems: 'center', justifyContent: 'center' }}
          >
            <Image src={EarnIllustrationLight} alt="Earn illustration" width={239} height={239} />
          </Grid>
        </Grid>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h3" mt={3} mb={2} fontWeight="bold">
            Your benefits
          </Typography>
          <Card sx={{ p: 4 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <Box className={css.benefitIcon}>
                  <SvgIcon component={CheckIcon} color="success" inheritViewBox fontSize="small" />
                </Box>
                <Box>
                  <Typography fontWeight="bold" mb={0.5}>
                    Never leave the app
                  </Typography>
                  <Typography>Interact with your assets right in Safe Wallet UI.</Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={2} className={css.benefit}>
                <Box className={css.benefitIcon}>
                  <SvgIcon component={StarIcon} color="success" inheritViewBox fontSize="small" />
                </Box>
                <Box>
                  <Typography fontWeight="bold" mb={0.5}>
                    Collect earnings every day
                  </Typography>
                  <Typography>Your balance keeps working for you.</Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={2} className={css.benefit}>
                <Box className={css.benefitIcon}>
                  <SvgIcon component={EyeIcon} color="success" inheritViewBox fontSize="small" />
                </Box>
                <Box>
                  <Typography fontWeight="bold" mb={0.5}>
                    Understand every transaction
                  </Typography>
                  <Typography>User-friendly transactions that are easy to understand for all signers.</Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={2} className={css.benefit}>
                <Box className={css.benefitIcon}>
                  <SvgIcon component={FiatIcon} color="success" inheritViewBox fontSize="small" />
                </Box>
                <Box>
                  <Typography fontWeight="bold" mb={0.5}>
                    Cash out whenever you want
                  </Typography>
                  <Typography>Zero lock-ups, zero penalties.</Typography>
                </Box>
              </Stack>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h3" mt={3} mb={2} fontWeight="bold">
            Eligible assets
          </Typography>

          <Stack spacing={2}>
            {eligibleAssets.map((asset) => {
              const vaultAPY = formatPercentage(VaultAPYs[chainId][asset.tokenInfo.address] / 100)

              const onEarnClick = () => {
                onGetStarted()

                trackEvent({ ...EARN_EVENTS.OPEN_EARN_PAGE, label: EARN_LABELS.info_asset })

                router.push({
                  pathname: AppRoutes.earn,
                  query: {
                    ...router.query,
                    asset_id: `${chainId}_${asset.tokenInfo.address}`,
                  },
                })
              }

              return (
                <Card key={asset.tokenInfo.address} sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <TokenIcon logoUri={asset.tokenInfo.logoUri} tokenSymbol={asset.tokenInfo.symbol} size={32} />
                      <Box>
                        <Typography variant="body2">
                          <TokenAmount
                            value={asset.balance}
                            decimals={asset.tokenInfo.decimals}
                            tokenSymbol={asset.tokenInfo.symbol}
                            logoUri={undefined}
                          />
                        </Typography>
                        <Typography variant="body2">
                          <FiatValue value={asset.fiatBalance} />
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Tooltip title="as of 03.06.2025">
                        <Typography variant="caption" className={css.apy}>
                          Up to {vaultAPY}*
                        </Typography>
                      </Tooltip>

                      <Button variant="outlined" size="small" onClick={onEarnClick}>
                        Earn
                      </Button>
                    </Stack>
                  </Stack>
                </Card>
              )
            })}
          </Stack>
        </Grid>
      </Grid>

      <Typography component="div" variant="caption" zIndex={2} mt={2}>
        {APYDisclaimer}
      </Typography>
    </Box>
  )
}

export default EarnInfo
