import { useState, useCallback, type ReactElement, type MouseEvent } from 'react'
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, SvgIcon } from '@mui/material'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import CloseIcon from '@mui/icons-material/Close'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import { OpenInNewRounded } from '@mui/icons-material'
import { useLoadFeature } from '@/features/__core__'
import { SupportChatFeature, useSupportChat } from '@/features/support-chat'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import css from './styles.module.css'

const HELP_CENTER_URL = 'https://help.safe.global'

const HelpMenu = (): ReactElement | null => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [isSupportOpen, setSupportOpen] = useState(false)
  const { SupportChatDrawer, $isDisabled } = useLoadFeature(SupportChatFeature)
  const { config, user } = useSupportChat()
  const isOfficialHost = useIsOfficialHost()

  const isMenuOpen = Boolean(anchorEl)
  const showSupport = !$isDisabled && isOfficialHost

  const handleFabClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (isSupportOpen) {
        setSupportOpen(false)
      } else {
        setAnchorEl(event.currentTarget)
      }
    },
    [isSupportOpen],
  )

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleHelpCenterClick = useCallback(() => {
    window.open(HELP_CENTER_URL, '_blank', 'noopener,noreferrer')
    setAnchorEl(null)
  }, [])

  const handleContactSupportClick = useCallback(() => {
    setSupportOpen(true)
    setAnchorEl(null)
  }, [])

  const handleSupportClose = useCallback(() => {
    setSupportOpen(false)
  }, [])

  return (
    <>
      <IconButton
        className={css.fab}
        onClick={handleFabClick}
        aria-label={isSupportOpen ? 'Close support chat' : 'Help menu'}
      >
        {isSupportOpen ? <CloseIcon /> : <HelpOutlineIcon />}
      </IconButton>

      <Menu
        className={css.menu}
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleHelpCenterClick}>
          <ListItemIcon>
            <HelpOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Help center</ListItemText>
          <SvgIcon component={OpenInNewRounded} fontSize="small" sx={{ color: 'text.secondary', ml: 1 }} />
        </MenuItem>

        {showSupport ? (
          <MenuItem onClick={handleContactSupportClick}>
            <ListItemIcon>
              <ChatBubbleOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Contact support</ListItemText>
          </MenuItem>
        ) : null}
      </Menu>

      {showSupport ? (
        <SupportChatDrawer open={isSupportOpen} onClose={handleSupportClose} config={config} user={user} />
      ) : null}
    </>
  )
}

export default HelpMenu
