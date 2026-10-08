import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import SpaceContextMenu from '../SpaceCard/SpaceContextMenu'
import { isUserActiveAdmin } from '@/features/spaces/utils'
import { skipToken } from '@reduxjs/toolkit/query'
import { useEntitlementsGetAllEntitlementsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import { useBillingSpaceId } from '../../hooks/billing/useBillingSpaceId'
import { SPACE_REFRESH_OPTIONS } from '../../hooks/refreshOptions'
import { SpaceRowView } from '@views/features/spaces/components/SpacesList/SpaceRowView'

/**
 * A single workspace row in the welcome "Workspaces" list, showing the
 * workspace name and its member/account counts. Clicking the row navigates
 * into the workspace; admins get a context menu to rename/remove it, while
 * members see a disabled menu with a tooltip explaining they lack access.
 */
const SpaceRow = ({
  space,
  currentUserId,
  showDivider = false,
}: {
  space: GetSpaceResponse
  currentUserId?: number
  showDivider?: boolean
}) => {
  const isAdmin = isUserActiveAdmin(space.members, currentUserId)
  const billingSpaceId = useBillingSpaceId(space.uuid)
  // All rows share the one cached request of all Workspaces' entitlements
  const { plan } = useEntitlementsGetAllEntitlementsV1Query(billingSpaceId ? undefined : skipToken, {
    ...SPACE_REFRESH_OPTIONS,
    selectFromResult: ({ currentData }) => ({ plan: currentData?.[space.uuid]?.plan }),
  })

  const handleOpenWorkspace = () => {
    trackEvent(
      { ...SPACE_EVENTS.WORKSPACE_SWITCHED, label: space.uuid },
      {
        from_workspace_id: undefined,
        to_workspace_id: space.uuid,
        source: 'space_selector',
        safe_count: space.safeCount,
      },
    )
  }

  return (
    <SpaceRowView
      uuid={space.uuid}
      name={space.name}
      safeCount={space.safeCount}
      memberCount={space.memberCount}
      hasPlan={!!plan}
      planName={plan?.name ?? undefined}
      isTrialing={plan?.status === 'trialing'}
      isAdmin={isAdmin}
      showDivider={showDivider}
      onOpenWorkspace={handleOpenWorkspace}
      contextMenu={<SpaceContextMenu space={space} />}
    />
  )
}

export default SpaceRow
