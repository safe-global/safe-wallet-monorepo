import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useCurrentSpaceId, useIsAdmin, useSpaceMembersByStatus } from '@/features/spaces'
import { WorkspaceTwoFactorSection } from '@/features/oidc-auth'
import { OfflineWorkspaceFeature } from '@/features/offline-workspace'
import { useLoadFeature } from '@/features/__core__'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import IdentitySection from '../sections/IdentitySection'
import AppearanceSection from '../sections/AppearanceSection'
import DangerZoneSection from '../sections/DangerZoneSection'

const GeneralPage = () => {
  const spaceId = useCurrentSpaceId()
  const isSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !isSignedIn || !spaceId })
  const { activeMembers } = useSpaceMembersByStatus()
  const isAdmin = useIsAdmin()
  const { ExportWorkspaceSection } = useLoadFeature(OfflineWorkspaceFeature)

  return (
    <div data-testid="settings-general-page">
      <IdentitySection space={space} />
      <WorkspaceTwoFactorSection members={activeMembers} spaceId={spaceId ?? undefined} isAdmin={isAdmin} />
      <AppearanceSection />
      {spaceId && <ExportWorkspaceSection spaceId={spaceId} />}
      <DangerZoneSection space={space} />
    </div>
  )
}

export default GeneralPage
