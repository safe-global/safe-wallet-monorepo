import { useRouter } from 'next/router'
import {
  SettingsRailView,
  type SettingsPageKey,
} from '@views/features/spaces/components/SpaceSettings/SettingsRailView'

export type { SettingsPageKey }

const SettingsRail = ({ activePage }: { activePage: SettingsPageKey }) => {
  const router = useRouter()
  const spaceId = typeof router.query.spaceId === 'string' ? router.query.spaceId : undefined

  return <SettingsRailView activePage={activePage} spaceId={spaceId} />
}

export default SettingsRail
