import { useState, type ReactElement } from 'react'
import { Button, Typography } from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import ManageTokensMenu from './ManageTokensMenu'
import { trackEvent, ASSETS_EVENTS } from '@/services/analytics'
import css from './styles.module.css'

interface ManageTokensButtonProps {
  onHideTokens?: () => void
  /** Takes precedence over useHasFeature(FEATURES.DEFAULT_TOKENLIST) when provided */
  _hasDefaultTokenlist?: boolean
  /** Takes precedence over useHasFeature(FEATURES.PORTFOLIO_ENDPOINT) when provided */
  _hasPortfolioEndpoint?: boolean
}

const ManageTokensButton = ({
  onHideTokens,
  _hasDefaultTokenlist,
  _hasPortfolioEndpoint,
}: ManageTokensButtonProps): ReactElement => {
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
      <ManageTokensMenu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onHideTokens={onHideTokens}
        _hasDefaultTokenlist={_hasDefaultTokenlist}
        _hasPortfolioEndpoint={_hasPortfolioEndpoint}
      />
    </>
  )
}

export default ManageTokensButton
