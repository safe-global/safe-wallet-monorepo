import { Box, Button, Card, IconButton, Stack, Typography } from '@mui/material'
import EarnIllustrationLight from '@/public/images/common/earn-illustration-light.png'
import Image from 'next/image'
import css from './styles.module.css'
import CloseIcon from '@mui/icons-material/Close'
import Track from '@/components/common/Track'
import { EARN_EVENTS, EARN_LABELS } from '@/services/analytics/events/earn'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useRouter } from 'next/router'

const EarnBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const router = useRouter()

  return (
    <Card className={css.banner}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={2}>
        <Image src={EarnIllustrationLight} alt="Earn illustration" width={95} height={95} />
        <Box>
          <Typography variant="h4" fontWeight="bold" color="static.main">
            Try enterprise-grade yields with up to 8.10% APY
          </Typography>

          <Typography variant="body2" color="static.light">
            Deposit stablecoins, wstETH, ETH, and WBTC and let your assets compound in minutes.
          </Typography>

          <Track {...EARN_EVENTS.OPEN_EARN_PAGE} label={EARN_LABELS.safe_dashboard_banner}>
            <Link href={AppRoutes.earn && { pathname: AppRoutes.earn, query: { safe: router.query.safe } }} passHref>
              <Button
                endIcon={<ChevronRightIcon fontSize="small" />}
                variant="text"
                size="compact"
                sx={{ mt: 1, p: 0.5 }}
                color="static"
              >
                Try now
              </Button>
            </Link>
          </Track>
        </Box>
      </Stack>

      <Track {...EARN_EVENTS.HIDE_EARN_BANNER}>
        <IconButton className={css.closeButton} aria-label="close" onClick={onDismiss}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Track>
    </Card>
  )
}

export default EarnBanner
