import { Card, Box, Grid2 as Grid, Typography, Button, SvgIcon } from '@mui/material'
import Image from 'next/image'
import EarnIllustrationLight from '@/public/images/common/earn-illustration-light.png'

import css from './styles.module.css'
import { EarnPoweredBy } from '@/features/earn/components/EarnDashboardBanner'
import CheckIcon from '@/public/images/common/check.svg'
import Track from '@/components/common/Track'
import { EARN_EVENTS, EARN_LABELS } from '@/services/analytics/events/earn'
import { EARN_HELP_ARTICLE } from '@/features/earn/constants'
import ExternalLink from '@/components/common/ExternalLink'

const EarnInfo = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <Box m={3}>
      <Card sx={{ p: 4 }}>
        <Grid container spacing={3}>
          <Grid container size={{ xs: 12, md: 7 }} rowSpacing={3}>
            <Grid size={{ xs: 12 }} zIndex={2} maxWidth={500}>
              <EarnPoweredBy />

              <Typography variant="h1" component="div" my={2}>
                Earn on your terms and get MORPHO rewards on top
              </Typography>

              <Typography variant="body1">
                Earn rewards on your stablecoins, wstETH, ETH, and WBTC by lending with Kiln widget into the Morpho
                protocol.{' '}
                <Track {...EARN_EVENTS.OPEN_EARN_LEARN_MORE} label={EARN_LABELS.info_banner}>
                  <ExternalLink href={EARN_HELP_ARTICLE}>Learn more</ExternalLink>
                </Track>
              </Typography>
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

      <Typography variant="h2" mt={3} mb={2}>
        What are your benefits?
      </Typography>

      <Card sx={{ p: 4 }}>
        <Grid container spacing={3} flexWrap={{ sm: 'wrap', md: 'nowrap' }}>
          <Grid size={{ sm: 3, md: 'grow' }}>
            <Box className={css.benefitIcon}>
              <SvgIcon component={CheckIcon} color="success" inheritViewBox fontSize="small" />
            </Box>
            <Typography fontWeight="bold" mb={0.5}>
              Collect earnings every day
            </Typography>
            <Typography>Your balance keeps working for you</Typography>
          </Grid>

          <Grid size={{ sm: 3, md: 'grow' }}>
            <Box className={css.benefitIcon}>
              <SvgIcon component={CheckIcon} color="success" inheritViewBox fontSize="small" />
            </Box>
            <Typography fontWeight="bold" mb={0.5}>
              Extra rewards
            </Typography>
            <Typography>Earn MORPHO tokens on top</Typography>
          </Grid>

          <Grid size={{ sm: 3, md: 'grow' }}>
            <Box className={css.benefitIcon}>
              <SvgIcon component={CheckIcon} color="success" inheritViewBox fontSize="small" />
            </Box>
            <Typography fontWeight="bold" mb={0.5}>
              Cash out whenever you want
            </Typography>
            <Typography>Zero lock-ups, zero penalties</Typography>
          </Grid>

          <Grid size={{ sm: 3, md: 'grow' }}>
            <Box className={css.benefitIcon}>
              <SvgIcon component={CheckIcon} color="success" inheritViewBox fontSize="small" />
            </Box>
            <Typography fontWeight="bold" mb={0.5}>
              Retain complete self-custody
            </Typography>
            <Typography>Your Safe, your crypto</Typography>
          </Grid>
        </Grid>
      </Card>
    </Box>
  )
}

export default EarnInfo
