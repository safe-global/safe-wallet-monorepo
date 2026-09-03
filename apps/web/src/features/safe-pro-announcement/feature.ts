import type { SafeProContract } from './contract'

import SafeProAnnouncement from './components/SafeProAnnouncement'
import SafeProAnnouncementModal from './components/SafeProAnnouncementModal'
import SafeProLockedWorkspace from './components/SafeProLockedWorkspace'
import SafeProTrialActivatedModal from './components/SafeProTrialActivatedModal'
import SafeProSubscriptionActivatedModal from './components/SafeProSubscriptionActivatedModal'
import SafeProBanner from './components/SafeProBanner'
import SafeProSidebarBanner from './components/SafeProSidebarBanner'
import SafeProWorkspacesBanner from './components/SafeProWorkspacesBanner'

export default {
  SafeProAnnouncement,
  SafeProAnnouncementModal,
  SafeProLockedWorkspace,
  SafeProTrialActivatedModal,
  SafeProSubscriptionActivatedModal,
  SafeProBanner,
  SafeProSidebarBanner,
  SafeProWorkspacesBanner,
} satisfies SafeProContract
