import { Box, Button, Card, IconButton, Link as MuiLink, Stack, Typography } from '@mui/material'
import css from './styles.module.css'
import CloseIcon from '@mui/icons-material/Close'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { useRouter } from 'next/router'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { AppRoutes } from '@/config/routes'
import { EARN_HELP_ARTICLE } from '@/features/earn/constants'
import VisibilityIcon from '@mui/icons-material/Visibility'

export const eurcvBoostBannerID = 'eurcvBoostBanner'

// EURCV token on Ethereum: chainId_tokenAddress
const EURCV_ASSET_ID = '1_0x5f7827fdeb7c20b443265fc2f40845b715385ff2'

export const EurcvBoostBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const router = useRouter()

  const handleCtaClick = () => {
    router.push({
      pathname: AppRoutes.earn,
      query: {
        safe: router.query.safe,
        asset_id: EURCV_ASSET_ID,
      },
    })
  }

  return (
    <Card className={`${css.banner} ${css.eurcvBanner}`}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        {/* Icon - using MUI's Visibility icon as eye icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <VisibilityIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        </Box>

        <Box>
          <Typography variant="h4" fontWeight="bold" color="static.main" className={css.bannerText}>
            EURCV is now available
          </Typography>

          <Typography variant="body2" color="static.light" className={css.bannerText} sx={{ mt: 0.5 }}>
            A new vault is added. Stake EURCV and earn 9.5% APY on deposits.{' '}
            <MuiLink
              href={EARN_HELP_ARTICLE}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'inherit', textDecoration: 'underline' }}
            >
              Learn more
            </MuiLink>
          </Typography>

          <Track {...OVERVIEW_EVENTS.OPEN_EURCV_BOOST}>
            <Button
              endIcon={<ChevronRightIcon fontSize="small" />}
              variant="text"
              size="compact"
              onClick={handleCtaClick}
              sx={{ mt: 1, p: 0.5 }}
              color="static"
            >
              Start earning
            </Button>
          </Track>
        </Box>
      </Stack>

      <Track {...OVERVIEW_EVENTS.HIDE_EURCV_BOOST_BANNER}>
        <IconButton className={css.closeButton} aria-label="close" onClick={onDismiss}>
          <CloseIcon fontSize="small" color="border" />
        </IconButton>
      </Track>
    </Card>
  )
}
