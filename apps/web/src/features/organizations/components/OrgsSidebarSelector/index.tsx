import { Box, Button, Divider, Menu, MenuItem, Typography } from '@mui/material'
import {
  type GetOrganizationResponse,
  useOrganizationsGetV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckIcon from '@mui/icons-material/Check'
import OrgsCard, { InitialsAvatar } from '../OrgsCard'
import css from './styles.module.css'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import OrgsCreationModal from '../OrgsCreationModal'
import { useCurrentOrgId } from '../../hooks/useCurrentOrgId'

const OrgsSidebarSelector = () => {
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const router = useRouter()
  const open = Boolean(anchorEl)
  const orgId = useCurrentOrgId()
  const { data: orgs } = useOrganizationsGetV1Query()
  const selectedOrg = orgs?.find((org) => org.id === Number(orgId))

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelectOrg = (org: GetOrganizationResponse) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, orgId: org.id.toString() },
    })

    handleClose()
  }

  if (!selectedOrg) return null

  return (
    <>
      <Box display="flex" width="100%">
        <Button
          id="org-selector-button"
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
          className={css.orgSelectorButton}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <InitialsAvatar orgName={selectedOrg.name} size="small" />
            <Typography
              variant="body2"
              fontWeight="bold"
              noWrap
              sx={{ maxWidth: '140px', textOverflow: 'ellipsis', overflow: 'hidden' }}
            >
              {selectedOrg.name}
            </Typography>
          </Box>
        </Button>

        <Menu
          id="org-selector-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          sx={{ '& .MuiPaper-root': { minWidth: '260px !important' } }}
        >
          <OrgsCard org={selectedOrg} isCompact isLink={false} />

          <Divider sx={{ mb: 1 }} />

          {orgs?.map((org) => (
            <MenuItem
              key={org.id}
              onClick={() => handleSelectOrg(org)}
              selected={org.id === selectedOrg.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <InitialsAvatar orgName={org.name} size="small" />
                <Typography variant="body2">{org.name}</Typography>
              </Box>
              {org.id === selectedOrg.id && <CheckIcon fontSize="small" color="primary" />}
            </MenuItem>
          ))}

          <Divider />

          <MenuItem
            onClick={() => {
              handleClose()
              setIsCreationModalOpen(true)
            }}
            sx={{ fontWeight: 700 }}
          >
            Create organization
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleClose()
              router.push(AppRoutes.welcome.organizations)
            }}
            sx={{ fontWeight: 700 }}
          >
            View organizations
          </MenuItem>
        </Menu>
      </Box>

      {isCreationModalOpen && <OrgsCreationModal onClose={() => setIsCreationModalOpen(false)} />}
    </>
  )
}

export default OrgsSidebarSelector
