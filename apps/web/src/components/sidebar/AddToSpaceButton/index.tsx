import { type ReactElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import Track from '@/components/common/Track'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { AppRoutes } from '@/config/routes'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useIsQualifiedSafe } from '@/features/spaces'

const AddToSpaceButton = (): ReactElement | null => {
  const router = useRouter()
  const { safe } = useSafeInfo()
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  const isQualifiedSafe = useIsQualifiedSafe()

  // Show when Spaces is enabled, safe is deployed, and safe is NOT already in a space
  if (!isSpacesFeatureEnabled || !safe.deployed || isQualifiedSafe) {
    return null
  }

  return (
    <Box mb={1}>
      <Track {...SPACE_EVENTS.ADD_SAFE_TO_SPACE} label={SPACE_LABELS.safe_dashboard_banner}>
        <Link href={{ pathname: AppRoutes.welcome.spaces, query: router.query }} passHref>
          <Button
            data-testid="add-to-space-btn"
            variant="contained"
            color="background"
            size="medium"
            fullWidth
            disableElevation
            startIcon={<AddIcon />}
          >
            Add to Space
          </Button>
        </Link>
      </Track>
    </Box>
  )
}

export default AddToSpaceButton
