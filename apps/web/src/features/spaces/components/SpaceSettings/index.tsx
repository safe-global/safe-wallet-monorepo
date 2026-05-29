import { useIsInvited } from '@/features/spaces'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import SettingsRail, { type SettingsPageKey } from './SettingsRail'
import GeneralPage from './pages/GeneralPage'
import AccountPage from './pages/AccountPage'
import AboutPage from './pages/AboutPage'

const SpaceSettings = ({ activePage = 'general' }: { activePage?: SettingsPageKey }) => {
  const isInvited = useIsInvited()

  return (
    <div>
      {isInvited && <PreviewInvite />}
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-12 sm:max-w-[1100px]">
        <SettingsRail activePage={activePage} />
        <div className="flex-1 min-w-0 sm:max-w-[720px]">
          {activePage === 'general' && <GeneralPage />}
          {activePage === 'account' && <AccountPage />}
          {activePage === 'about' && <AboutPage />}
        </div>
      </div>
    </div>
  )
}

export default SpaceSettings
