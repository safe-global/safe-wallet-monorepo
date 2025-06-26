import css from '@/components/dashboard/NewsCarousel/banners/styles.module.css'
import { Box, Button, Card, IconButton, Stack, Typography } from '@mui/material'
import Image from 'next/image'
import EarnIllustrationLight from '@/public/images/common/earn-illustration-light.png'
import Track from '@/components/common/Track'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import { OVERVIEW_EVENTS } from '@/services/analytics'
import { useRouter } from 'next/router'

export const stakeBannerID = 'stakeBanner'

const StakeBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const router = useRouter()

  return (
    <Card className={css.banner}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Image className={css.bannerImage} src={EarnIllustrationLight} alt="Earn illustration" width={95} height={95} />
        <Box>
          <Typography variant="h4" fontWeight="bold" color="static.main" className={css.bannerText}>
            Stake your ETH and earn rewards
          </Typography>

          <Typography variant="body2" color="static.light" className={css.bannerText}>
            Lock 32 ETH and become a validator easily with the Kiln widget. You can also explore Safe Apps or home
            staking for other options. Staking involves risks like slashing.
          </Typography>

          <Track {...OVERVIEW_EVENTS.OPEN_STAKING_WIDGET}>
            <Link href={AppRoutes.stake && { pathname: AppRoutes.stake, query: { safe: router.query.safe } }} passHref>
              <Button
                endIcon={<ChevronRightIcon fontSize="small" />}
                variant="text"
                size="compact"
                sx={{ mt: 1, p: 0.5 }}
                color="static"
              >
                Stake ETH
              </Button>
            </Link>
          </Track>
        </Box>
      </Stack>

      <Track {...OVERVIEW_EVENTS.HIDE_STAKING_BANNER}>
        <IconButton className={css.closeButton} aria-label="close" onClick={onDismiss}>
          <CloseIcon fontSize="small" color="border" />
        </IconButton>
      </Track>
    </Card>
  )
}

export default StakeBanner
