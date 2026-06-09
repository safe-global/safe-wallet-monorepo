import { Popover, PopoverTrigger } from '@/components/ui/popover'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import useLogout from '@/hooks/useLogout'
import { ProfilePopoverContent } from '@/features/spaces/components/Sidebar/ProfilePopoverContent'

interface MembershipProps {
  membership?: MemberDto
}

export const AccountInfo = ({ membership }: MembershipProps) => {
  const { logout } = useLogout()
  const name = membership?.name || ''

  return (
    <Popover>
      <PopoverTrigger className="cursor-pointer transition hover:opacity-85">
        <InitialsAvatar name={name} size="large" rounded />
      </PopoverTrigger>

      <ProfilePopoverContent
        avatarName={name}
        displayName={name}
        role={membership?.role}
        onSignOut={logout}
        className="border"
      />
    </Popover>
  )
}
