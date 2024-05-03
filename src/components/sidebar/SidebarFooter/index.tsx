import type { ReactElement } from 'react'
import {
  SidebarList,
  SidebarListItemButton,
  SidebarListItemIcon,
  SidebarListItemText,
} from '@/components/sidebar/SidebarList'
import DocsIcon from '@/public/images/sidebar/docs.svg'

import { ListItem } from '@mui/material'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'

const SidebarFooter = (): ReactElement => {
  // const dispatch = useAppDispatch()
  // const cookies = useAppSelector(selectCookies)
  // const chain = useCurrentChain()

  // const hasBeamerConsent = useCallback(() => cookies[CookieType.UPDATES], [cookies])

  // useEffect(() => {
  //   // Initialise Beamer when consent was previously given
  //   if (hasBeamerConsent() && chain?.shortName) {
  //     loadBeamer(chain.shortName)
  //   }
  // }, [hasBeamerConsent, chain?.shortName])

  // const handleBeamer = () => {
  //   if (!hasBeamerConsent()) {
  //     dispatch(openCookieBanner({ warningKey: CookieType.UPDATES }))
  //   }
  // }

  return (
    <SidebarList>
      {/* {!IS_PRODUCTION && (
        <ListItem disablePadding>
          <DebugToggle />
        </ListItem>
      )} */}

      {/* <Track {...OVERVIEW_EVENTS.WHATS_NEW}>
        <ListItem disablePadding>
          <SidebarListItemButton id={BEAMER_SELECTOR} onClick={handleBeamer}>
            <SidebarListItemIcon color="primary">
              <BeamerIcon />
            </SidebarListItemIcon>
            <SidebarListItemText data-testid="list-item-whats-new" bold>
              What&apos;s new
            </SidebarListItemText>
          </SidebarListItemButton>
        </ListItem>
      </Track> */}

      <Track {...OVERVIEW_EVENTS.HELP_CENTER}>
        <ListItem disablePadding>
          <a target="_blank" rel="noopener noreferrer" href="/#" style={{ width: '100%' }}>
            <SidebarListItemButton>
              <SidebarListItemIcon color="primary">
                <DocsIcon />
              </SidebarListItemIcon>
              <SidebarListItemText data-testid="list-item-need-help" bold>
                Docs
              </SidebarListItemText>
            </SidebarListItemButton>
          </a>
        </ListItem>
      </Track>
    </SidebarList>
  )
}

export default SidebarFooter
