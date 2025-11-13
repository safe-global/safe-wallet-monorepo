import { useState, type ReactElement } from 'react'
import { Button, Typography } from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import ManageTokensMenu from './ManageTokensMenu'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { trackEvent, ASSETS_EVENTS } from '@/services/analytics'
import css from './styles.module.css'

interface ManageTokensButtonProps {
  onHideTokens?: () => void
}

const ManageTokensButton = ({ onHideTokens }: ManageTokensButtonProps): ReactElement => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    trackEvent(ASSETS_EVENTS.OPEN_TOKEN_LIST_MENU)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outlined"
        size="small"
        startIcon={<SettingsIcon fontSize="small" />}
        data-testid="manage-tokens-button"
        className={css.button}
      >
        <Typography fontSize="medium">Manage tokens</Typography>
      </Button>
      <ManageTokensMenu anchorEl={anchorEl} open={open} onClose={handleClose} onHideTokens={onHideTokens} />
    </>
  )
}

export default ManageTokensButton
