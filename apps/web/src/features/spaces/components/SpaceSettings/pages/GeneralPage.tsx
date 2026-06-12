import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useCurrentSpaceId } from '@/features/spaces'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import IdentitySection from '../sections/IdentitySection'
import AppearanceSection from '../sections/AppearanceSection'
import DangerZoneSection from '../sections/DangerZoneSection'

const GeneralPage = () => {
  const spaceId = useCurrentSpaceId()
  const isSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !isSignedIn || !spaceId })

  return (
    <div data-testid="settings-general-page">
      <IdentitySection space={space} />
      <AppearanceSection />
      <DangerZoneSection space={space} />
    </div>
  )
}

export default GeneralPage
