import { useState, useImperativeHandle, forwardRef, type ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
    const [open, setOpen] = useState(false)

    const handleOpenChange = (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (nextOpen) {
        trackEvent(ASSETS_EVENTS.OPEN_TOKEN_LIST_MENU)
      }
    }

    useImperativeHandle(ref, () => ({
      openMenu: () => {
        handleOpenChange(true)
      },
    }))

    const handleClose = () => {
      setOpen(false)
    }

    return (
      <DropdownMenu open={open} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" data-testid="manage-tokens-button">
              <SettingsIcon className="size-4 sm:mr-2" />
              <span className="hidden sm:inline">Manage tokens</span>
            </Button>
          }
        />
        <ManageTokensMenu
          onClose={handleClose}
          onHideTokens={onHideTokens}
          _hasDefaultTokenlist={_hasDefaultTokenlist}
        />
      </DropdownMenu>
    )
  },
)

ManageTokensButton.displayName = 'ManageTokensButton'

export default ManageTokensButton
