import { type ReactElement, useEffect } from 'react'
import { BEAMER_SELECTOR, loadBeamer } from '@/services/beamer'
import { useAppDispatch, useAppSelector } from '@/store'
import { CookieAndTermType, hasConsentFor } from '@/store/cookiesAndTermsSlice'
import { openCookieBanner } from '@/store/popupSlice'
import BeamerIcon from '@/public/images/sidebar/whats-new.svg'
import HelpCenterIcon from '@/public/images/sidebar/help-center.svg'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import DebugToggle from '../DebugToggle'
import { IS_PRODUCTION } from '@/config/constants'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useCurrentChain } from '@/hooks/useChains'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'
import IndexingStatus from '@/components/sidebar/IndexingStatus'

const SidebarFooter = (): ReactElement => {
  const dispatch = useAppDispatch()
  const chain = useCurrentChain()
  const hasBeamerConsent = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.UPDATES))

  useEffect(() => {
    // Initialise Beamer when consent was previously given
    if (hasBeamerConsent && chain?.shortName) {
      loadBeamer(chain.shortName)
    }
  }, [hasBeamerConsent, chain?.shortName])

  const handleBeamer = () => {
    if (!hasBeamerConsent) {
      dispatch(openCookieBanner({ warningKey: CookieAndTermType.UPDATES }))
    }
  }

  return (
    <>
      {!IS_PRODUCTION && (
        <>
          <div className="flex w-full">
            <DebugToggle />
          </div>

          <Separator className="bg-[var(--color-background-main)]" />
        </>
      )}

      <div className="mx-2 my-1 flex flex-row items-center gap-2">
        <IndexingStatus />

        <div className="ml-auto">
          <Track
            {...OVERVIEW_EVENTS.WHATS_NEW}
            mixpanelParams={{ [MixpanelEventParams.SIDEBAR_ELEMENT]: "What's New" }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBeamer}
              id={BEAMER_SELECTOR}
              data-testid="list-item-whats-new"
              className="text-[var(--color-primary-main)]"
            >
              <BeamerIcon className="size-4" />
            </Button>
          </Track>
        </div>

        <Track
          {...OVERVIEW_EVENTS.HELP_CENTER}
          mixpanelParams={{ [MixpanelEventParams.SIDEBAR_ELEMENT]: 'Help Center' }}
        >
          <Button
            variant="ghost"
            size="icon"
            render={<a href={HELP_CENTER_URL} target="_blank" rel="noopener noreferrer" />}
            data-testid="list-item-need-help"
            className="text-[var(--color-primary-main)]"
          >
            <HelpCenterIcon className="size-4" />
          </Button>
        </Track>
      </div>
    </>
  )
}

export default SidebarFooter
