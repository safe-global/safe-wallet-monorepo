import type { ReactElement } from 'react'
import CookieAndTermBanner from '@/components/common/CookieAndTermBanner'
import WhatsNewTopBar from '@/components/common/WhatsNewTopBar'
import WhatsNewUpdatesFrame from '@/components/common/WhatsNewUpdatesFrame'
import Notifications from '@/components/common/Notifications'
import { StepUpDialog } from '@/features/oidc-auth'
import PkModulePopup from '@/services/private-key-module/PkModulePopup'
import { useLoadFeature } from '@/features/__core__'
import { TargetedOutreachFeature } from '@/features/targeted-outreach'

const TargetedOutreachPopupLoader = () => {
  const { OutreachPopup } = useLoadFeature(TargetedOutreachFeature)
  return <OutreachPopup />
}

/**
 * The visible app-level UI that renders next to the page layout: banners, popups, dialogs and toasts.
 * Both app shells and the full-page Storybook layouts render it, so page stories show what users see.
 */
const AppChrome = (): ReactElement => (
  <>
    <CookieAndTermBanner />
    <WhatsNewTopBar />
    <WhatsNewUpdatesFrame />
    <TargetedOutreachPopupLoader />
    <Notifications />
    <StepUpDialog />
    <PkModulePopup />
  </>
)

export default AppChrome
