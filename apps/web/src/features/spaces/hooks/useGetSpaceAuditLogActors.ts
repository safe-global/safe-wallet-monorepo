import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useSpaceAuditGetAuditLogActorsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const useGetSpaceAuditLogActors = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)

  const { currentData: actors } = useSpaceAuditGetAuditLogActorsV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserSignedIn || !spaceId },
  )

  return actors || []
}

export default useGetSpaceAuditLogActors
