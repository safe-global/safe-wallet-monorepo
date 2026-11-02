import { useCallback, useState, type ReactElement } from 'react'
import { Sparkles } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { SidebarMenuButton } from '@safe-global/views/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { cn } from '@safe-global/views/utils/cn'
import css from '../styles.module.css'
import Track from '@/components/common/Track'
import { BEAMER_ID } from '@/config/constants'
import { useWhatsNewUpdates } from '@/hooks/useWhatsNewUpdates'
import { OVERVIEW_EVENTS, MixpanelEventParams } from '@/services/analytics'
import { useAppDispatch, useAppSelector } from '@/store'
import { CookieAndTermType, hasConsentFor } from '@/store/cookiesAndTermsSlice'
import { openCookieBanner } from '@/store/popupSlice'
import { WhatsNewDrawer } from '../WhatsNewDrawer'
import { WhatsNewCornerCard } from '../WhatsNewCornerCard'

export const WhatsNewButton = (): ReactElement => {
  const dispatch = useAppDispatch()
  const hasUpdatesConsent = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.UPDATES))
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount, markAsSeen } = useWhatsNewUpdates()

  const openWhatsNew = useCallback(() => {
    if (!hasUpdatesConsent) {
      dispatch(openCookieBanner({ warningKey: CookieAndTermType.UPDATES }))
      return
    }
    setIsOpen(true)
    markAsSeen()
  }, [dispatch, hasUpdatesConsent, markAsSeen])

  const closeWhatsNew = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <>
      <Track {...OVERVIEW_EVENTS.WHATS_NEW} mixpanelParams={{ [MixpanelEventParams.SIDEBAR_ELEMENT]: "What's New" }}>
        <Tooltip>
          <TooltipTrigger
            render={
              <SidebarMenuButton
                type="button"
                data-testid="list-item-whats-new"
                aria-label="What's new"
                className={cn(
                  'relative h-9 w-9 min-w-9 shrink-0 gap-0 !px-0 !py-0 text-center !justify-center !overflow-visible',
                  '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.25]',
                  css.sidebarInteractive,
                )}
                onClick={openWhatsNew}
              />
            }
          >
            <Sparkles aria-hidden strokeWidth={1.25} />
            {unreadCount > 0 && (
              <Badge
                variant="brand"
                size="sm"
                className="absolute -top-1 -right-1"
                data-testid="whats-new-unread-count"
              >
                {unreadCount}
              </Badge>
            )}
          </TooltipTrigger>
          <TooltipContent side="top">What&apos;s new</TooltipContent>
        </Tooltip>
      </Track>
      {BEAMER_ID && <WhatsNewDrawer productId={BEAMER_ID} open={isOpen} onClose={closeWhatsNew} />}
      <WhatsNewCornerCard onOpen={openWhatsNew} />
    </>
  )
}
