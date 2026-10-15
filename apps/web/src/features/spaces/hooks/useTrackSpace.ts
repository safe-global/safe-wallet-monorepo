import type { AllSafeItems } from '@/hooks/safes'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'

const useTrackSpace = (safes: AllSafeItems, activeMembers: MemberDto[]) => {
  useTrackOnce({ ...SPACE_EVENTS.TOTAL_SAFE_ACCOUNTS, label: safes.length })
  useTrackOnce({ ...SPACE_EVENTS.TOTAL_ACTIVE_MEMBERS, label: activeMembers.length })
}

export default useTrackSpace
