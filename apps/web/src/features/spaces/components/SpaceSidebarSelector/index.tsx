import { Box, Button, Divider, Menu, MenuItem, Typography } from '@mui/material'
import { type GetSpaceResponse, useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckIcon from '@mui/icons-material/Check'
import SpaceCard from '../SpaceCard'
import InitialsAvatar from '../InitialsAvatar'

import css from './styles.module.css'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import SpaceCreationModal from '../SpaceCreationModal'
import { useCurrentSpaceId } from 'src/features/spaces/hooks/useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { SPACE_LABELS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { getNonDeclinedSpaces } from '@/features/spaces/utils'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'

const SpaceSidebarSelector = () => {
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const router = useRouter()
  const open = Boolean(anchorEl)
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const { currentData: spaces } = useSpacesGetV1Query(undefined, { skip: !isUserSignedIn })
  const selectedSpace = spaces?.find((space) => space.id === Number(spaceId))

  const nonDeclinedSpaces = getNonDeclinedSpaces(currentUser, spaces || [])

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelectSpace = (space: GetSpaceResponse) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, spaceId: space.id.toString() },
    })

    handleClose()
  }

  if (!selectedSpace) return null

  return (
    <>
      <Box display="flex" width="100%">
        <Button
          data-testid="space-selector-button"
          id="space-selector-button"
          onClick={handleClick}
          endIcon={
            <ExpandMoreIcon
              className={css.expandIcon}
              sx={{
                transform: open ? 'rotate(180deg)' : undefined,
                color: 'border.main',
              }}
            />
          }
          fullWidth
          className={css.spaceSelectorButton}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <InitialsAvatar name={selectedSpace.name} size="small" />
            <Typography
              variant="body2"
              fontWeight="bold"
              noWrap
              sx={{ maxWidth: '140px', textOverflow: 'ellipsis', overflow: 'hidden' }}
            >
              {selectedSpace.name}
            </Typography>
          </Box>
        </Button>

        <Menu
          data-testid="space-selector-menu"
          id="space-selector-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          sx={{ '& .MuiPaper-root': { minWidth: '260px !important' } }}
        >
          <SpaceCard space={selectedSpace} isCompact isLink={false} />

          <Divider sx={{ mb: 1 }} />

          {nonDeclinedSpaces.map((space) => (
            <MenuItem
              key={space.id}
              onClick={() => handleSelectSpace(space)}
              selected={space.id === selectedSpace.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <InitialsAvatar name={space.name} size="small" />
                <Typography variant="body2">{space.name}</Typography>
              </Box>
              {space.id === selectedSpace.id && <CheckIcon fontSize="small" color="primary" />}
            </MenuItem>
          ))}

          <Divider />

          <MenuItem
            onClick={() => {
              handleClose()
              setIsCreationModalOpen(true)
              trackEvent({ ...SPACE_EVENTS.CREATE_SPACE_MODAL, label: SPACE_LABELS.space_selector })
            }}
            sx={{ fontWeight: 700 }}
          >
            Create space
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleClose()
              trackEvent({ ...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE, label: SPACE_LABELS.space_selector })
              router.push(AppRoutes.welcome.spaces)
            }}
            sx={{ fontWeight: 700 }}
          >
            View spaces
          </MenuItem>
        </Menu>
      </Box>

      {isCreationModalOpen && <SpaceCreationModal onClose={() => setIsCreationModalOpen(false)} />}
    </>
  )
}

export default SpaceSidebarSelector
