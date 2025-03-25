import type { AllSafeItems } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import type { Member } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useEffect } from 'react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

let isTotalSafesTracked = false
let isTotalMembersTracked = false

const useTrackSpace = (safes: AllSafeItems, activeMembers: Member[]) => {
  useEffect(() => {
    if (isTotalSafesTracked) return

    trackEvent({ ...SPACE_EVENTS.TOTAL_SAFE_ACCOUNTS, label: safes.length })
    isTotalSafesTracked = true
  }, [safes.length])

  useEffect(() => {
    if (isTotalMembersTracked) return

    trackEvent({ ...SPACE_EVENTS.TOTAL_ACTIVE_MEMBERS, label: activeMembers.length })
    isTotalMembersTracked = true
  }, [activeMembers.length])
}

export default useTrackSpace
