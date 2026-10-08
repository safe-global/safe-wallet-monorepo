import type { ReactNode } from 'react'
import type { SettingsPageKey } from './SettingsRailView'

export type SpaceSettingsViewProps = {
  activePage: SettingsPageKey
  isInvited: boolean
  previewInvite: ReactNode
  rail: ReactNode
  generalPage: ReactNode
  accountPage: ReactNode
  aboutPage: ReactNode
}

export const SpaceSettingsView = ({
  activePage,
  isInvited,
  previewInvite,
  rail,
  generalPage,
  accountPage,
  aboutPage,
}: SpaceSettingsViewProps) => {
  return (
    <div>
      {isInvited && previewInvite}
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-12 sm:max-w-[1100px]">
        {rail}
        <div className="flex-1 min-w-0 sm:max-w-[720px]">
          {activePage === 'general' && generalPage}
          {activePage === 'account' && accountPage}
          {activePage === 'about' && aboutPage}
        </div>
      </div>
    </div>
  )
}
