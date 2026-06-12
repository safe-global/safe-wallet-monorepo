import { Popover, PopoverTrigger } from '@/components/ui/popover'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import useLogout from '@/hooks/useLogout'
import { ProfilePopoverContent } from '../Sidebar/ProfilePopoverContent'

interface MembershipProps {
  profileName?: string
  displayName?: string
}

export const AccountInfo = ({ profileName = '', displayName = '' }: MembershipProps) => {
  const { logout } = useLogout()

  return (
    <Popover>
      <PopoverTrigger className="cursor-pointer transition hover:opacity-85">
        <InitialsAvatar name={profileName} size="large" rounded />
      </PopoverTrigger>

      <ProfilePopoverContent avatarName={profileName} displayName={displayName} onSignOut={logout} className="border" />
    </Popover>
  )
}
