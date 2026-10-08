import { useState, useImperativeHandle, forwardRef, type ReactElement } from 'react'
import ManageTokensMenu from './ManageTokensMenu'
import { trackEvent, ASSETS_EVENTS } from '@/services/analytics'
import { ManageTokensButtonView } from '@views/components/balances/ManageTokensButton/ManageTokensButtonView'

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
      <ManageTokensButtonView
        open={open}
        onOpenChange={handleOpenChange}
        menu={
          <ManageTokensMenu
            onClose={handleClose}
            onHideTokens={onHideTokens}
            _hasDefaultTokenlist={_hasDefaultTokenlist}
          />
        }
      />
    )
  },
)

ManageTokensButton.displayName = 'ManageTokensButton'

export default ManageTokensButton
