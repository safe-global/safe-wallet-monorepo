import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'

export default function SpaceAddressBookPage() {
  const spaces = useLoadFeature(SpacesFeature)

  return <spaces.SpaceAddressBookPage />
}
