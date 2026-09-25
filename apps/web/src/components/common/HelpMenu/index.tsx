import { useState, useCallback, type ReactElement } from 'react'
import { HelpCircle, MessageCircle, ExternalLink } from 'lucide-react'
import { Popover, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import ProWordmark from '@/public/images/safe-pro/pro-wordmark.svg'
import { cn } from '@/utils/cn'
import { useLoadFeature } from '@/features/__core__'
import { SupportChatFeature, useSupportEligibility } from '@/features/support-chat'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'

const HELP_CENTER_URL = 'https://help.safe.global'

type HelpMenuProps = {
  anchorEl: HTMLElement | null
  onClose: () => void
}

const HelpMenu = ({ anchorEl, onClose }: HelpMenuProps): ReactElement | null => {
  const [isSupportOpen, setSupportOpen] = useState(false)
  const { WorkspaceSupportChat, $isDisabled } = useLoadFeature(SupportChatFeature)
  const isOfficialHost = useIsOfficialHost()

  const isMenuOpen = Boolean(anchorEl)
  const showSupport = !$isDisabled && isOfficialHost
  const isSupportEligible = useSupportEligibility(showSupport && isMenuOpen)

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
            // eslint-disable-next-line no-restricted-syntax -- menu-item button: auto height + row padding; pending a menu-item size
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
              // eslint-disable-next-line no-restricted-syntax -- menu-item button: auto height + row padding; pending a menu-item size
              className="h-auto w-full justify-start gap-2 px-3 py-2 font-normal"
            >
              <MessageCircle className="size-4" />
              <span className="flex-1 text-left">Contact support</span>
              <span
                className={cn(
                  'flex shrink-0 items-center rounded-sm px-2 py-1.5',
                  isSupportEligible
                    ? 'bg-[var(--color-secondary-light)] text-foreground dark:bg-muted dark:text-[var(--color-secondary-light)]'
                    : 'bg-muted/50 text-muted-foreground/60',
                )}
                title={isSupportEligible ? 'Premium support active' : 'Live chat requires Safe Pro'}
                style={{
                  boxShadow: isSupportEligible
                    ? '0 0 8px color-mix(in srgb, var(--color-secondary-light) 24%, transparent)'
                    : undefined,
                }}
              >
                <ProWordmark aria-hidden="true" className="size-auto h-2 w-[21px] overflow-visible" />
                <span className="sr-only">PRO</span>
              </span>
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>

      {showSupport ? <WorkspaceSupportChat open={isSupportOpen} onClose={handleSupportClose} /> : null}
    </>
  )
}

export default HelpMenu
