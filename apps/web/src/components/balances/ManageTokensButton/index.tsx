import { useState, useImperativeHandle, forwardRef, type ReactElement } from 'react'
import { Button, Typography } from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import ManageTokensMenu from './ManageTokensMenu'
import { trackEvent, ASSETS_EVENTS } from '@/services/analytics'
import css from './styles.module.css'

interface ManageTokensButtonProps {
  onHideTokens?: () => void
  /** Takes precedence over useHasFeature(FEATURES.DEFAULT_TOKENLIST) when provided */
  _hasDefaultTokenlist?: boolean
}

export interface ManageTokensButtonHandle {
  openMenu: (anchorElement?: HTMLElement) => void
}

const ManageTokensButton = forwardRef<ManageTokensButtonHandle, ManageTokensButtonProps>(
  ({ onHideTokens, _hasDefaultTokenlist }, ref): ReactElement => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget)
      trackEvent(ASSETS_EVENTS.OPEN_TOKEN_LIST_MENU)
    }

    useImperativeHandle(ref, () => ({
      openMenu: (anchorElement?: HTMLElement) => {
        if (anchorElement) {
          setAnchorEl(anchorElement)
        } else {
          const button = document.querySelector('[data-testid="manage-tokens-button"]') as HTMLElement
          if (button) {
            setAnchorEl(button)
          }
        }
        trackEvent(ASSETS_EVENTS.OPEN_TOKEN_LIST_MENU)
      },
    }))

    const handleClose = () => {
      setAnchorEl(null)
    }

    return (
      <>
        <Button
          onClick={handleClick}
          variant="text"
          size="small"
          startIcon={<SettingsIcon fontSize="small" />}
          data-testid="manage-tokens-button"
          className={css.button}
          sx={{
            backgroundColor: { xs: 'var(--color-background-paper)', sm: 'transparent' },
            padding: { xs: '6px', sm: '8px' },
            minWidth: { xs: '40px', sm: 'auto' },
            '&:hover': { backgroundColor: { xs: '#ffffff', sm: 'var(--color-background-secondary)' } },
            '& .MuiButton-startIcon': { marginRight: { xs: 0, sm: '8px' } },
          }}
        >
          <Typography fontSize="medium" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Manage tokens
          </Typography>
        </Button>
        <ManageTokensMenu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          onHideTokens={onHideTokens}
          _hasDefaultTokenlist={_hasDefaultTokenlist}
        />
      </>
    )
  },
)

ManageTokensButton.displayName = 'ManageTokensButton'

export default ManageTokensButton
