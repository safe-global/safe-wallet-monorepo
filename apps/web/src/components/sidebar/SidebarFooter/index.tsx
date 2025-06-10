import { type ReactElement, useEffect } from 'react'
import { BEAMER_SELECTOR, loadBeamer } from '@/services/beamer'
import { useAppDispatch, useAppSelector } from '@/store'
import { CookieAndTermType, hasConsentFor } from '@/store/cookiesAndTermsSlice'
import { openCookieBanner } from '@/store/popupSlice'
import BeamerIcon from '@/public/images/sidebar/whats-new.svg'
import HelpCenterIcon from '@/public/images/sidebar/help-center.svg'
import { Divider, IconButton, ListItem, Stack, SvgIcon, Box } from '@mui/material'
import DebugToggle from '../DebugToggle'
import { IS_PRODUCTION } from '@/config/constants'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
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
          <ListItem disablePadding>
            <DebugToggle />
          </ListItem>

          <Divider flexItem />
        </>
      )}

      <Stack direction="row" alignItems="center" spacing={1} my={0.5} mx={1}>
        <IndexingStatus />

        <Box ml="auto !important">
          <Track {...OVERVIEW_EVENTS.WHATS_NEW}>
            <IconButton onClick={handleBeamer} id={BEAMER_SELECTOR} data-testid="list-item-whats-new" color="primary">
              <SvgIcon component={BeamerIcon} inheritViewBox fontSize="small" />
            </IconButton>
          </Track>
        </Box>

        <Track {...OVERVIEW_EVENTS.HELP_CENTER}>
          <IconButton href={HELP_CENTER_URL} target="_blank" data-testid="list-item-need-help" color="primary">
            <SvgIcon component={HelpCenterIcon} inheritViewBox fontSize="small" />
          </IconButton>
        </Track>
      </Stack>
    </>
  )
}

export default SidebarFooter
