import { useState, useCallback, type ReactElement, type MouseEvent } from 'react'
import dynamic from 'next/dynamic'
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, SvgIcon } from '@mui/material'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import CloseIcon from '@mui/icons-material/Close'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import CampaignIcon from '@mui/icons-material/Campaign'
import { OpenInNewRounded } from '@mui/icons-material'
import { useSupportChat } from '@/hooks/useSupportChat'
import UnreadBadge from '@/components/common/UnreadBadge'
import { SUPPORT_CHAT_APP_ID, SUPPORT_CHAT_ENABLED } from '@/config/constants'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import css from './styles.module.css'

const SupportChatDrawer = dynamic(
  () =>
    import('@safe-global/support-chat-embed').then((mod) => mod.SupportChatDrawer).catch(() => () => null),
  { ssr: false, loading: () => null },
)

const HELP_CENTER_URL = 'https://help.safe.global'
const WHATS_NEW_URL = '#'

const HelpMenu = (): ReactElement | null => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [isSupportOpen, setSupportOpen] = useState(false)
  const { config, user } = useSupportChat()
  const isOfficialHost = useIsOfficialHost()

  const isMenuOpen = Boolean(anchorEl)
  const showSupport = Boolean(SUPPORT_CHAT_ENABLED && isOfficialHost && SUPPORT_CHAT_APP_ID)

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

  const handleWhatsNewClick = useCallback(() => {
    if (WHATS_NEW_URL !== '#') {
      window.open(WHATS_NEW_URL, '_blank', 'noopener,noreferrer')
    }
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

        <MenuItem onClick={handleWhatsNewClick}>
          <ListItemIcon>
            <CampaignIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>What&apos;s new</ListItemText>
          <UnreadBadge count={1} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <span />
          </UnreadBadge>
        </MenuItem>
      </Menu>

      {showSupport ? (
        <SupportChatDrawer open={isSupportOpen} onClose={handleSupportClose} config={config} user={user} />
      ) : null}
    </>
  )
}

export default HelpMenu
