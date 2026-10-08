import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsAdmin } from '../../hooks/useSpaceMembers'
import { getDeterministicColor } from '@/utils/colors'
import SpaceContextMenuNew from './SpaceContextMenuNew'
import { SpaceCardNewView, SpaceSummaryNew } from '@views/features/spaces/components/SpaceCardNew/SpaceCardNewView'

export { SpaceSummaryNew }

// TODO(spaces): staged successor to SpaceCard for the Spaces redesign — not yet wired into
// SpacesList. Kept in sync with BE changes (UUID #8020, memberCount #8150).
const SpaceCardNew = ({ space, isLink = true }: { space: GetSpaceResponse; isLink?: boolean }) => {
  const { uuid, name, safeCount, memberCount } = space
  const isAdmin = useIsAdmin(uuid)

  const logoColor = getDeterministicColor(name)

  return (
    <SpaceCardNewView
      uuid={uuid}
      name={name}
      safeCount={safeCount}
      memberCount={memberCount}
      isLink={isLink}
      logoColor={logoColor}
      isAdmin={isAdmin}
      contextMenu={<SpaceContextMenuNew space={space} />}
    />
  )
}

export default SpaceCardNew
