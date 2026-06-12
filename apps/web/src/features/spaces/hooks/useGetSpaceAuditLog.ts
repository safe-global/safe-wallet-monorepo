import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useSpaceAuditGetAuditLogV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

export type SpaceAuditLogQueryArgs = {
  cursor?: string
  actorUserId?: number
  createdAtGte?: string
  createdAtLte?: string
  sortDirection?: 'asc' | 'desc'
}

const useGetSpaceAuditLog = (args: SpaceAuditLogQueryArgs = {}) => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)

  return useSpaceAuditGetAuditLogV1Query(
    {
      spaceId: spaceId ?? '',
      cursor: args.cursor,
      actorUserId: args.actorUserId,
      createdAtGte: args.createdAtGte,
      createdAtLte: args.createdAtLte,
      sortDirection: args.sortDirection,
    },
    { skip: !isUserSignedIn || !spaceId },
  )
}

export default useGetSpaceAuditLog
