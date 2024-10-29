import type { ReactElement } from 'react'
import {
  SidebarList,
  SidebarListItemButton,
  SidebarListItemIcon,
  SidebarListItemText,
} from '@/components/sidebar/SidebarList'
import DocsIcon from '@/public/images/sidebar/docs.svg'
import FeedbackIcon from '@/public/images/sidebar/feedback.svg'
import { ListItem } from '@mui/material'

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

      <ListItem disablePadding>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://tally.superchain.eco/accountsform"
          style={{ width: '100%' }}
        >
          <SidebarListItemButton>
            <SidebarListItemIcon color="primary">
              <FeedbackIcon />
            </SidebarListItemIcon>
            <SidebarListItemText data-testid="list-item-whats-new" bold>
              Feedback
            </SidebarListItemText>
          </SidebarListItemButton>
        </a>
      </ListItem>
      <ListItem disablePadding>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://ecosystem-accounts.super.site/"
          style={{ width: '100%' }}
        >
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
    </SidebarList>
  )
}

export default SidebarFooter
