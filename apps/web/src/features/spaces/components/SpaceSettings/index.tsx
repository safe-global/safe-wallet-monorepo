import type { ComponentType } from 'react'
import { useIsInvited } from '@/features/spaces'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import SettingsRail, { type SettingsPageKey } from './SettingsRail'
import GeneralPage from './pages/GeneralPage'
import AccountPage from './pages/AccountPage'
import AboutPage from './pages/AboutPage'

const PAGES: Record<SettingsPageKey, ComponentType> = {
  general: GeneralPage,
  account: AccountPage,
  about: AboutPage,
}

const SpaceSettings = ({ activePage = 'general' }: { activePage?: SettingsPageKey }) => {
  const isInvited = useIsInvited()
  const ActiveContent = PAGES[activePage]

  return (
    <div>
      {isInvited && <PreviewInvite />}
      <div className="flex items-start gap-8 max-w-[1180px]">
        <SettingsRail activePage={activePage} />
        <div className="flex-1 min-w-0">
          <ActiveContent />
        </div>
      </div>
    </div>
  )
}

export default SpaceSettings
