import { useIsInvited } from '@/features/spaces'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import SettingsRail, { type SettingsPageKey } from './SettingsRail'
import GeneralPage from './pages/GeneralPage'
import AccountPage from './pages/AccountPage'
import AboutPage from './pages/AboutPage'
import { SpaceSettingsView } from '@views/features/spaces/components/SpaceSettings/SpaceSettingsView'

const SpaceSettings = ({ activePage = 'general' }: { activePage?: SettingsPageKey }) => {
  const isInvited = useIsInvited()

  return (
    <SpaceSettingsView
      activePage={activePage}
      isInvited={isInvited}
      previewInvite={<PreviewInvite />}
      rail={<SettingsRail activePage={activePage} />}
      generalPage={<GeneralPage />}
      accountPage={<AccountPage />}
      aboutPage={<AboutPage />}
    />
  )
}

export default SpaceSettings
