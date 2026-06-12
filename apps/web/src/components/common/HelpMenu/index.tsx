import { useState, useCallback, type ReactElement } from 'react'
import { HelpCircle, MessageCircle, ExternalLink } from 'lucide-react'
import { Popover, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useLoadFeature } from '@/features/__core__'
import { SupportChatFeature, useSupportChat } from '@/features/support-chat'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'

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

  const isMenuOpen = Boolean(anchorEl)
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
      <Popover
        open={isMenuOpen}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <PopoverContent anchor={anchorEl} side="top" align="end" className="w-auto min-w-32 gap-1 p-1">
          <Button
            variant="ghost"
            onClick={handleHelpCenterClick}
            className="h-auto w-full justify-start gap-2 px-3 py-2 font-normal"
          >
            <HelpCircle className="size-4" />
            <span className="flex-1 text-left">Help center</span>
            <ExternalLink className="size-4 text-[var(--color-text-secondary)]" />
          </Button>

          {showSupport ? (
            <Button
              variant="ghost"
              onClick={handleContactSupportClick}
              className="h-auto w-full justify-start gap-2 px-3 py-2 font-normal"
            >
              <MessageCircle className="size-4" />
              <span className="flex-1 text-left">Contact support</span>
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>

      {showSupport ? (
        <SupportChatDrawer open={isSupportOpen} onClose={handleSupportClose} config={config} user={user} />
      ) : null}
    </>
  )
}

export default HelpMenu
