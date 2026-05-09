import { useState, useImperativeHandle, forwardRef, type ReactElement } from 'react'
import { Box, Button } from '@mui/material'
import ManageTokensMenu from './ManageTokensMenu'
import { trackEvent, ASSETS_EVENTS } from '@/services/analytics'
import SettingsIcon from '@/public/images/sidebar/settings.svg'

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
          variant="outlined"
          size="small"
          startIcon={<SettingsIcon />}
          data-testid="manage-tokens-button"
          sx={{
            px: '12px',
            '& .MuiButton-startIcon': { marginRight: { xs: 0, sm: '8px' } },
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Manage tokens
          </Box>
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
