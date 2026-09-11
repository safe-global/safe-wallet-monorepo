import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TOOLTIP_DELAY_MS } from '@/components/common/AccountRow'

const MAX_VISIBLE_WORKSPACES = 2

/**
 * Overlapping stack of the workspaces a Safe belongs to, with a `+N` overflow count. Avatars are
 * sized to match the network logos, and each reveals its full workspace name on hover (the avatar
 * only shows initials).
 */
export function WorkspaceAvatars({ spaces }: { spaces: GetSpaceResponse[] }) {
  if (spaces.length === 0) return null

  const visible = spaces.slice(0, MAX_VISIBLE_WORKSPACES)
  const overflow = spaces.slice(MAX_VISIBLE_WORKSPACES)

  return (
    <div data-testid="account-workspaces" className="bg-foreground/5 inline-flex items-center rounded-full p-0.5">
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {visible.map((space) => (
            <Tooltip key={space.uuid} delay={TOOLTIP_DELAY_MS}>
              <TooltipTrigger render={<span className="inline-flex rounded-full" />}>
                <InitialsAvatar name={space.name} size="small" rounded />
              </TooltipTrigger>
              <TooltipContent>{space.name}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        {overflow.length > 0 && (
          <Tooltip delay={TOOLTIP_DELAY_MS}>
            <TooltipTrigger
              render={
                <span className="text-foreground flex size-6 items-center justify-center text-xs font-semibold" />
              }
            >
              +{overflow.length}
            </TooltipTrigger>
            <TooltipContent>{overflow.map((space) => space.name).join(', ')}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
