import { type ReactElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { AppRoutes } from '@/config/routes'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useIsQualifiedSafe } from '@/features/spaces'

const AddToSpaceButton = (): ReactElement | null => {
  const router = useRouter()
  const { safe } = useSafeInfo()
  const isQualifiedSafe = useIsQualifiedSafe()

  // Hide when safe is not deployed or already in a space
  if (!safe.deployed || isQualifiedSafe) {
    return null
  }

  return (
    <CheckWallet allowNonOwner allowUndeployedSafe>
      {(ok) => (
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
                disabled={!ok}
                startIcon={<AddIcon />}
              >
                Add to Space
              </Button>
            </Link>
          </Track>
        </Box>
      )}
    </CheckWallet>
  )
}

export default AddToSpaceButton
