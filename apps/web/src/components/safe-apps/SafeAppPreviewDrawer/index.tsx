import Link from 'next/link'
import { useRouter } from 'next/router'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import SvgIcon from '@mui/material/SvgIcon'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'

import { getSafeAppUrl } from '@/components/safe-apps/SafeAppCard'
import ChainIndicator from '@/components/common/ChainIndicator'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import SafeAppActionButtons from '@/components/safe-apps/SafeAppActionButtons'
import SafeAppTags from '@/components/safe-apps/SafeAppTags'
import SafeAppSocialLinksCard from '@/components/safe-apps/SafeAppSocialLinksCard'
import CloseIcon from '@/public/images/common/close.svg'
import { useOpenedSafeApps } from '@/hooks/safe-apps/useOpenedSafeApps'
import css from './styles.module.css'
import { SAFE_APPS_EVENTS, SAFE_APPS_LABELS, trackSafeAppEvent, SafeAppLaunchLocation } from '@/services/analytics'

type SafeAppPreviewDrawerProps = {
  safeApp?: SafeAppData
  isOpen: boolean
  isBookmarked?: boolean
  onClose: () => void
  onBookmark?: (safeAppId: number) => void
}

const SafeAppPreviewDrawer = ({ isOpen, safeApp, isBookmarked, onClose, onBookmark }: SafeAppPreviewDrawerProps) => {
  const { markSafeAppOpened } = useOpenedSafeApps()
  const router = useRouter()
  const safeAppUrl = getSafeAppUrl(router, safeApp?.url || '')

  const onOpenSafe = () => {
    if (safeApp) {
      markSafeAppOpened(safeApp.id)
      trackSafeAppEvent({ ...SAFE_APPS_EVENTS.OPEN_APP, label: SAFE_APPS_LABELS.apps_sidebar }, safeApp, {
        launchLocation: SafeAppLaunchLocation.PREVIEW_DRAWER,
      })
    }
  }

  return (
    <Drawer anchor="right" open={isOpen} onClose={onClose}>
      <Box className={css.drawerContainer}>
        {/* Toolbar */}

        {safeApp && (
          <Box display="flex" justifyContent="right">
            <SafeAppActionButtons safeApp={safeApp} isBookmarked={isBookmarked} onBookmarkSafeApp={onBookmark} />
            <Tooltip title={`Close ${safeApp.name} preview`} placement="top">
              <IconButton
                onClick={onClose}
                size="small"
                sx={{
                  color: 'border.main',
                  ml: 1,
                }}
              >
                <SvgIcon component={CloseIcon} inheritViewBox color="border" fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Safe App Info */}
        <Box sx={{ px: 1 }}>
          <SafeAppIconCard src={safeApp?.iconUrl || ''} alt={`${safeApp?.name} logo`} width={90} height={90} />
        </Box>

        <Typography variant="h4" fontWeight={700} sx={{ mt: 2 }}>
          {safeApp?.name}
        </Typography>

        <Typography variant="body2" color="primary.light" sx={{ mt: 2 }}>
          {safeApp?.description}
        </Typography>

        {/* Tags */}
        <SafeAppTags tags={safeApp?.tags || []} />

        {/* Networks */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Available networks
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
          {safeApp?.chainIds.map((chainId) => (
            <ChainIndicator key={chainId} chainId={chainId} inline showUnknown={false} />
          ))}
        </Box>

        {/* Open Safe App button */}
        <Link href={safeAppUrl} passHref legacyBehavior>
          <Button
            data-testid="open-safe-app-btn"
            fullWidth
            variant="contained"
            color="primary"
            component="a"
            href={safeApp?.url}
            sx={{ mt: 3 }}
            onClick={onOpenSafe}
          >
            Open Safe App
          </Button>
        </Link>

        {/* Safe App Social Links */}
        {safeApp && <SafeAppSocialLinksCard safeApp={safeApp} />}
      </Box>
    </Drawer>
  )
}

export default SafeAppPreviewDrawer
