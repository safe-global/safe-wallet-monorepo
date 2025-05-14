import { Card, Box, Grid2 as Grid, Typography, Button } from '@mui/material'
import Image from 'next/image'
import EarnIllustrationLight from '@/public/images/common/earn-illustration-light.png'
import { useDarkMode } from '@/hooks/useDarkMode'

import css from '@/features/earn/components/EarnDashboardBanner/styles.module.css'
import { EarnPoweredBy } from '@/features/earn/components/EarnDashboardBanner'

const EarnInfo = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <Box m={3}>
      <Card sx={{ p: 4 }}>
        <Grid container>
          <Grid container size={{ xs: 12, md: 7 }} rowSpacing={2}>
            <Grid size={{ xs: 12 }} mb={1} zIndex={2}>
              <EarnPoweredBy />
            </Grid>

            <Grid size={{ xs: 12 }} zIndex={2} width={1}>
              <Typography variant="h2">Earn on your terms with MORPHO rewards</Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }} mb={1} zIndex={2} sx={{ width: '100% !important' }}>
              <Typography variant="body1" className={css.content}>
                Earn rewards on your stablecoins, wstETH, ETH, and WBTC by lending with Kiln widget into the Morpho
                protocol.
              </Typography>
            </Grid>

            <Grid container size={{ xs: 12 }} textAlign="center" spacing={2}>
              <Grid size={{ xs: 12, md: 'auto' }}>
                <Button fullWidth variant="contained" onClick={onGetStarted}>
                  Get started
                </Button>
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
    </Box>
  )
}

export default EarnInfo
