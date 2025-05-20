import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import Track from '@/components/common/Track'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import CloseIcon from '@mui/icons-material/Close'
import css from './styles.module.css'

const hideWidgetLocalStorageKey = 'hideSpacesDashboardWidget'

const SpacesDashboardWidget = () => {
  const [widgetHidden = false, setWidgetHidden] = useLocalStorage<boolean>(hideWidgetLocalStorageKey)

  const onHide = () => {
    setWidgetHidden(true)
  }

  if (widgetHidden) return null

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      flexWrap="wrap"
      gap={2}
      p={2}
      sx={{ backgroundColor: 'secondary.light' }}
      position="relative"
    >
      <Box flex={1} minWidth="60%">
        <Typography>
          🎉 <b>New! Improved Spaces:</b> All your Safe Accounts, finally organized. Streamlined for teams and solo
          users alike
        </Typography>
      </Box>

      <Stack className={css.buttons} direction="row" gap={2} alignItems="flex-end">
        <Track {...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE} label={SPACE_LABELS.safe_dashboard_banner}>
          <Link href={AppRoutes.welcome.spaces} passHref>
            <Button variant="text" size="compact">
              Try now
            </Button>
          </Link>
        </Track>

        <Track {...SPACE_EVENTS.HIDE_DASHBOARD_WIDGET}>
          <IconButton aria-label="close" onClick={onHide}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Track>
      </Stack>
    </Stack>
  )
}

export default SpacesDashboardWidget
