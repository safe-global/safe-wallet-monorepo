import { User } from 'lucide-react'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import useLogout from '@/hooks/useLogout'
import { ProfilePopoverContent } from '../Sidebar/ProfilePopoverContent'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

interface MembershipProps {
  profileName?: string
  displayName?: string
}

export const AccountInfo = ({ profileName = '', displayName = '' }: MembershipProps) => {
  const { logout } = useLogout()

  const handleSignOut = () => {
    trackEvent(SPACE_EVENTS.AUTH_LOGGED_OUT, { timestamp: new Date().toISOString() })
    logout()
  }

  return (
    <Popover>
      {/* Sized and styled like the other topbar icon buttons (see HeaderNavigation). */}
      <PopoverTrigger
        className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg outline-none transition-colors hover:bg-muted-foreground/10 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Account menu"
      >
        <User className="size-5 text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>

      <ProfilePopoverContent avatarName={profileName} displayName={displayName} onSignOut={handleSignOut} />
    </Popover>
  )
}
