import { useState, useCallback, type ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { SupportChatFeature, useSupportChat } from '@/features/support-chat'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { HelpMenuView } from '@views/components/common/HelpMenu/HelpMenuView'

const HELP_CENTER_URL = 'https://help.safe.global'

type HelpMenuProps = {
  anchorEl: HTMLElement | null
  onClose: () => void
}

const HelpMenu = ({ anchorEl, onClose }: HelpMenuProps): ReactElement | null => {
  const [isSupportOpen, setSupportOpen] = useState(false)
  const { SupportChatDrawer, $isDisabled } = useLoadFeature(SupportChatFeature)
  const { config, user } = useSupportChat()
  const isOfficialHost = useIsOfficialHost()

  const showSupport = !$isDisabled && isOfficialHost

  const handleHelpCenterClick = useCallback(() => {
    window.open(HELP_CENTER_URL, '_blank', 'noopener,noreferrer')
    onClose()
  }, [onClose])

  const handleContactSupportClick = useCallback(() => {
    setSupportOpen(true)
    onClose()
  }, [onClose])

  const handleSupportClose = useCallback(() => {
    setSupportOpen(false)
  }, [])

  return (
    <>
      <HelpMenuView
        anchorEl={anchorEl}
        onClose={onClose}
        showSupport={showSupport}
        onHelpCenterClick={handleHelpCenterClick}
        onContactSupportClick={handleContactSupportClick}
      />

      {showSupport ? (
        <SupportChatDrawer open={isSupportOpen} onClose={handleSupportClose} config={config} user={user} />
      ) : null}
    </>
  )
}

export default HelpMenu
