import type { SafeProContract } from './contract'

import SafeProAnnouncement from './components/SafeProAnnouncement'
import SafeProAnnouncementModal from './components/SafeProAnnouncementModal'
import SafeProLockedMemberModal from './components/SafeProLockedMemberModal'
import SafeProTrialActivatedModal from './components/SafeProTrialActivatedModal'
import SafeProSubscriptionActivatedModal from './components/SafeProSubscriptionActivatedModal'
import SafeProBillingReminderModal from './components/SafeProBillingReminderModal'
import SafeProBanner from './components/SafeProBanner'
import SafeProSidebarBanner from './components/SafeProSidebarBanner'
import SafeProWorkspacesBanner from './components/SafeProWorkspacesBanner'

export default {
  SafeProAnnouncement,
  SafeProAnnouncementModal,
  SafeProLockedMemberModal,
  SafeProTrialActivatedModal,
  SafeProSubscriptionActivatedModal,
  SafeProBillingReminderModal,
  SafeProBanner,
  SafeProSidebarBanner,
  SafeProWorkspacesBanner,
} satisfies SafeProContract
