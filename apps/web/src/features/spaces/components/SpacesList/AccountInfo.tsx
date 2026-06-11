import { User } from 'lucide-react'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import useLogout from '@/hooks/useLogout'
import { ProfilePopoverContent } from '@/features/spaces/components/Sidebar/ProfilePopoverContent'
import css from '@/features/spaces/components/Sidebar/styles.module.css'

interface MembershipProps {
  profileName?: string
  displayName?: string
}

export const AccountInfo = ({ profileName = '', displayName = '' }: MembershipProps) => {
  const { logout } = useLogout()

  return (
    <Popover>
      <PopoverTrigger className={`${css.profileTriggerAvatarPlain} cursor-pointer`} aria-label="Account menu">
        <User className="size-5" aria-hidden="true" />
      </PopoverTrigger>

      <ProfilePopoverContent avatarName={profileName} displayName={displayName} onSignOut={logout} className="border" />
    </Popover>
  )
}
