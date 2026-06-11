import type { ReactElement } from 'react'
import { SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import { User } from 'lucide-react'
import { useCurrentMemberProfile, MemberStatus } from '@/features/spaces'
import useLogout from '@/hooks/useLogout'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { ProfilePopoverContent } from './ProfilePopoverContent'
import css from './styles.module.css'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

export interface SidebarProfileViewProps {
  profileName: string
  displayName: string
  role: string
  onSignOut: () => void
}

export const SidebarProfileView = ({
  profileName,
  displayName,
  role,
  onSignOut,
}: SidebarProfileViewProps): ReactElement => (
  <>
    <Separator />
    <SidebarFooter data-testid="sidebar-profile-section" className="py-1">
      <SidebarMenu>
        <SidebarMenuItem>
          <Popover>
            <PopoverTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className={cn(css.sidebarInteractive, css.footerHelp, css.sidebarNavItem, css.profileTrigger)}
                  data-testid="sidebar-profile-trigger"
                  aria-label="Profile menu"
                />
              }
            >
              <span className={css.profileTriggerAvatar}>
                <User className="size-4" aria-hidden="true" />
              </span>
              <span className={css.profileName}>{profileName}</span>
            </PopoverTrigger>

            <ProfilePopoverContent
              avatarName={profileName}
              displayName={displayName}
              role={role}
              onSignOut={onSignOut}
            />
          </Popover>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </>
)

const ProfileSkeleton = () => (
  <>
    <Separator />
    <SidebarFooter data-testid="sidebar-profile-skeleton">
      <div className="flex items-center gap-3 px-3 py-2">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-4 w-24 group-data-[collapsible=icon]:hidden" />
      </div>
    </SidebarFooter>
  </>
)

export const getSidebarProfileInfo = (membership: MemberDto, signerAddress?: string, email?: string) => {
  const memberName = membership.name || 'User'
  const profileName = email || memberName
  const displayName = email || (signerAddress ? shortenAddress(signerAddress) : memberName)

  return {
    profileName,
    displayName,
  }
}

export const SidebarProfileSection = (): ReactElement | null => {
  const { membership, email, signerAddress, isLoading } = useCurrentMemberProfile()
  const { logout } = useLogout()

  if (isLoading && !membership) return <ProfileSkeleton />
  if (!membership || membership.status !== MemberStatus.ACTIVE) return null

  const { profileName, displayName } = getSidebarProfileInfo(membership, signerAddress, email)
  const role = membership.role.toLowerCase()

  const handleSignOut = () => {
    trackEvent(SPACE_EVENTS.AUTH_LOGGED_OUT, { timestamp: new Date().toISOString() })
    logout()
  }

  return (
    <SidebarProfileView profileName={profileName} displayName={displayName} role={role} onSignOut={handleSignOut} />
  )
}
