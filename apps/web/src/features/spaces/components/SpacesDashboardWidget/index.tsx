import { Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material'
import Track from '@/components/common/Track'
import SpaceInfoModal from '../SpaceInfoModal'
import { useState } from 'react'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import CloseIcon from '@mui/icons-material/Close'

const gradientBg = {
  background: 'linear-gradient(225deg, rgba(95, 221, 255, 0.15) 12.5%, rgba(18, 255, 128, 0.15) 88.07%)',
}

const hideWidgetLocalStorageKey = 'hideSpacesDashboardWidget'

const SpacesDashboardWidget = () => {
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false)
  const [widgetHidden = false, setWidgetHidden] = useLocalStorage<boolean>(hideWidgetLocalStorageKey)

  const onHide = () => {
    setWidgetHidden(true)
  }

  if (widgetHidden) return null

  return (
    <>
      <Stack direction="row" flexWrap="wrap" gap={2} p={3} sx={gradientBg} position="relative">
        <Box sx={{ position: 'absolute', right: 24, top: 16 }}>
          <Track {...SPACE_EVENTS.HIDE_DASHBOARD_WIDGET}>
            <IconButton aria-label="close" onClick={onHide} size="small">
              <CloseIcon fontSize="medium" />
            </IconButton>
          </Track>
        </Box>

        <Box flex={1} minWidth="60%">
          <Chip label="Beta" sx={{ backgroundColor: '#12FF80', borderRadius: '4px' }} size="small" />

          <Typography variant="h6" fontWeight="700" mb={2} mt={1}>
            Spaces are here!
          </Typography>

          <Typography variant="body2">
            Organize your Safe Accounts, all in one place. Collaborate efficiently with your team members and simplify
            treasury management.
            <br />
            Available now in beta.
          </Typography>
        </Box>

        <Stack direction="row" gap={2} alignItems="flex-end">
          <Track {...SPACE_EVENTS.INFO_MODAL} label={SPACE_LABELS.safe_dashboard_banner}>
            <Button variant="outlined" onClick={() => setIsInfoOpen(true)}>
              Learn more
            </Button>
          </Track>

          <Track {...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE} label={SPACE_LABELS.safe_dashboard_banner}>
            <Link href={AppRoutes.welcome.spaces} passHref>
              <Button variant="contained" sx={{ minHeight: '48px' }}>
                Try now
              </Button>
            </Link>
          </Track>
        </Stack>
      </Stack>
      {isInfoOpen && <SpaceInfoModal onClose={() => setIsInfoOpen(false)} />}
    </>
  )
}

export default SpacesDashboardWidget
