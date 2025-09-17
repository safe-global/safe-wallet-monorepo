import type { ReactElement } from 'react'
// import { useEffect } from 'react'

import {
  SidebarList,
  SidebarListItemButton,
  SidebarListItemIcon,
  SidebarListItemText,
} from '@/components/sidebar/SidebarList'
import { BEAMER_SELECTOR } from '@/services/beamer'
// import { useAppDispatch, useAppSelector } from '@/store'
// import { CookieAndTermType, hasConsentFor } from '@/store/cookiesAndTermsSlice'
// import { openCookieBanner } from '@/store/popupSlice'
import HelpCenterIcon from '@/public/images/sidebar/help-center.svg'
import { Link, ListItem, SvgIcon, Typography, Divider } from '@mui/material'
import DebugToggle from '../DebugToggle'
import { HELP_CENTER_URL, IS_PRODUCTION, NEW_SUGGESTION_FORM } from '@/config/constants'
// import { useCurrentChain } from '@/hooks/useChains'
import darkPalette from '@/components/theme/darkPalette'
import SuggestionIcon from '@/public/images/sidebar/lightbulb_icon.svg'
import ProtofireLogo from '@/public/images/protofire-logo.svg'

const SidebarFooter = (): ReactElement => {
  // const dispatch = useAppDispatch()
  // const chain = useCurrentChain()
  // const hasBeamerConsent = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.UPDATES))

  // useEffect(() => {
  //   // Initialise Beamer when consent was previously given
  //   if (hasBeamerConsent && chain?.shortName) {
  //     loadBeamer(chain.shortName)
  //   }
  // }, [hasBeamerConsent, chain?.shortName])

  // const handleBeamer = () => {
  //   if (!hasBeamerConsent) {
  //     dispatch(openCookieBanner({ warningKey: CookieAndTermType.UPDATES }))
  //   }
  // }

  return (
    <SidebarList>
      {!IS_PRODUCTION && (
        <>
          <ListItem disablePadding>
            <DebugToggle />
          </ListItem>

          <Divider flexItem />
        </>
      )}

      <ListItem disablePadding>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={HELP_CENTER_URL}
          style={{ width: '100%', marginBottom: '3px' }}
        >
          <SidebarListItemButton>
            <SidebarListItemIcon color="primary">
              <HelpCenterIcon />
            </SidebarListItemIcon>
            <SidebarListItemText data-testid="list-item-need-help" bold>
              Need help?
            </SidebarListItemText>
          </SidebarListItemButton>
        </a>
      </ListItem>
      <ListItem disablePadding>
        <a target="_blank" rel="noopener noreferrer" href={NEW_SUGGESTION_FORM} style={{ width: '100%' }}>
          <SidebarListItemButton id={BEAMER_SELECTOR} style={{ backgroundColor: '#12FF80', color: 'black' }}>
            <SidebarListItemIcon color="primary">
              <SuggestionIcon />
            </SidebarListItemIcon>
            <SidebarListItemText bold>New Features Suggestion?</SidebarListItemText>
          </SidebarListItemButton>
        </a>
      </ListItem>

      <ListItem>
        <SidebarListItemText>
          <Typography variant="caption">
            Supported by{' '}
            <SvgIcon
              component={ProtofireLogo}
              inheritViewBox
              fontSize="small"
              sx={{ verticalAlign: 'middle', mx: 0.5 }}
            />
            <Link href="https://protofire.io" sx={{ color: darkPalette.primary.main, textDecoration: 'none' }}>
              Protofire
            </Link>
          </Typography>
        </SidebarListItemText>
      </ListItem>
    </SidebarList>
  )
}

export default SidebarFooter
