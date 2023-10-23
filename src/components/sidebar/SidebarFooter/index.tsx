import type { ReactElement } from 'react'
import { useCallback, useEffect } from 'react'

import {
  SidebarList,
  SidebarListItemButton,
  SidebarListItemIcon,
  SidebarListItemText,
} from '@/components/sidebar/SidebarList'
import { BEAMER_SELECTOR, loadBeamer } from '@/services/beamer'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectCookies, CookieType } from '@/store/cookiesSlice'
import { openCookieBanner } from '@/store/popupSlice'
import BeamerIcon from '@/public/images/sidebar/whats-new.svg'
import { ListItem } from '@mui/material'
import DebugToggle from '../DebugToggle'
import { IS_PRODUCTION } from '@/config/constants'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { useCurrentChain } from '@/hooks/useChains'

const SidebarFooter = (): ReactElement => {
  const dispatch = useAppDispatch()
  const cookies = useAppSelector(selectCookies)
  const chain = useCurrentChain()

  const hasBeamerConsent = useCallback(() => cookies[CookieType.UPDATES], [cookies])

  useEffect(() => {
    // Initialise Beamer when consent was previously given
    if (hasBeamerConsent() && chain?.shortName) {
      loadBeamer(chain.shortName)
    }
  }, [hasBeamerConsent, chain?.shortName])

  const handleBeamer = () => {
    if (!hasBeamerConsent()) {
      dispatch(openCookieBanner({ warningKey: CookieType.UPDATES }))
    }
  }

  return (
    <SidebarList>
      {!IS_PRODUCTION && (
        <ListItem disablePadding>
          <DebugToggle />
        </ListItem>
      )}

      <Track {...OVERVIEW_EVENTS.WHATS_NEW}>
        <ListItem disablePadding>
          <SidebarListItemButton id={BEAMER_SELECTOR} onClick={handleBeamer}>
            <SidebarListItemIcon color="primary">
              <BeamerIcon />
            </SidebarListItemIcon>
            <SidebarListItemText bold>What&apos;s new</SidebarListItemText>
          </SidebarListItemButton>
        </ListItem>
      </Track>

      <Track {...OVERVIEW_EVENTS.HELP_CENTER}>
        <ListItem disablePadding></ListItem>
      </Track>
    </SidebarList>
  )
}

export default SidebarFooter
