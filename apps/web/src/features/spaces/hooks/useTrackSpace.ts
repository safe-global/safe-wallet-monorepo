import type { AllSafeItems } from '@/hooks/safes'
import type { Member } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useEffect, useRef } from 'react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

const useTrackSpace = (safes: AllSafeItems, activeMembers: Member[]) => {
  const isTotalSafesTracked = useRef(false)
  const isTotalMembersTracked = useRef(false)

  useEffect(() => {
    if (isTotalSafesTracked.current) return

    trackEvent({ ...SPACE_EVENTS.TOTAL_SAFE_ACCOUNTS, label: safes.length })
    isTotalSafesTracked.current = true
  }, [safes.length])

  useEffect(() => {
    if (isTotalMembersTracked.current) return

    trackEvent({ ...SPACE_EVENTS.TOTAL_ACTIVE_MEMBERS, label: activeMembers.length })
    isTotalMembersTracked.current = true
  }, [activeMembers.length])
}

export default useTrackSpace
