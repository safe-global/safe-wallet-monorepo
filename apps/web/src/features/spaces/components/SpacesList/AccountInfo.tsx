import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { LogOut } from 'lucide-react'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Separator } from '@/components/ui/separator'
import sidebarCss from '@/features/spaces/components/Sidebar/styles.module.css'
import { cn } from '@/utils/cn'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import useLogout from '@/hooks/useLogout'

interface MembershipProps {
  membership?: MemberDto
}

export const AccountInfo = ({ membership }: MembershipProps) => {
  const { logout } = useLogout()

  return (
    <Popover>
      <PopoverTrigger className="cursor-pointer transition hover:opacity-85">
        <InitialsAvatar name={membership?.name || ''} size="large" rounded />
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="center"
        sideOffset={12}
        className={cn(sidebarCss.profilePopover, 'border')}
        data-testid="sidebar-profile-popover"
      >
        <div className={sidebarCss.profileHeader}>
          <InitialsAvatar name={membership?.name || ''} size="medium" rounded />
          <span className={sidebarCss.profileSignedIn}>Signed in</span>
        </div>

        <div className={sidebarCss.profileInfo}>
          <span className={sidebarCss.profileName}>{membership?.name || ''}</span>
          <span className={sidebarCss.profileRole}>{membership?.role}</span>
        </div>

        <Separator />

        <button
          type="button"
          className={sidebarCss.profileSignOut}
          onClick={logout}
          data-testid="sidebar-profile-sign-out"
          aria-label="Sign out"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </PopoverContent>
    </Popover>
  )
}
