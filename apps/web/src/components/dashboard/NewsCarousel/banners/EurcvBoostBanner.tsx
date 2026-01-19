import { Box, Button, Card, IconButton, Link as MuiLink, Stack } from '@mui/material'
import css from './styles.module.css'
import CloseIcon from '@mui/icons-material/Close'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { EARN_HELP_ARTICLE, EURCV_APY } from '@/features/earn/constants'
import { EURCV_ASSET_ID } from '@/config/eurcv'

export const eurcvBoostBannerID = 'eurcvBoostBanner'

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
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'flex-start' }}
        spacing={2}
        className={css.eurcvStack}
      >
        <Box className={css.eurcvIconContainer}>
          <img src="/images/eurcv-boost/eurcv.svg" alt="EURCV" className={css.eurcvIconImage} />
        </Box>

        <Box className={css.eurcvContent}>
          <Box className={css.eurcvTextContainer}>
            <span className={css.eurcvTitle}>EURCV is now available</span>
            <span className={css.eurcvDescription}>
              A new vault is added. Stake EURCV and earn {EURCV_APY}% APY on deposits.{' '}
              <MuiLink
                href={EARN_HELP_ARTICLE}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: 'inherit', textDecoration: 'underline' }}
              >
                Learn more
              </MuiLink>
            </span>
          </Box>

          <Track {...OVERVIEW_EVENTS.OPEN_EURCV_BOOST}>
            <Button
              endIcon={<ChevronRightIcon fontSize="small" />}
              variant="text"
              size="compact"
              onClick={handleCtaClick}
              className={css.eurcvButton}
            >
              Start earning
            </Button>
          </Track>
        </Box>
      </Stack>

      {/* Close Button */}
      <Track {...OVERVIEW_EVENTS.HIDE_EURCV_BOOST_BANNER}>
        <IconButton className={css.closeButton} aria-label="close" onClick={onDismiss} sx={{ padding: 0 }}>
          <CloseIcon fontSize="small" color="border" />
        </IconButton>
      </Track>
    </Card>
  )
}
