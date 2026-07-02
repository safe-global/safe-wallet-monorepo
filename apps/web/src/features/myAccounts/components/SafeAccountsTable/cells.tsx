import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import InitialsAvatar from '@/components/common/InitialsAvatar'

const MAX_VISIBLE_WORKSPACES = 2

/** Overlapping stack of the workspaces a Safe belongs to, with a `+N` overflow bubble. */
export function WorkspaceAvatars({ spaces }: { spaces: GetSpaceResponse[] }) {
  if (spaces.length === 0) return null

  const visible = spaces.slice(0, MAX_VISIBLE_WORKSPACES)
  const overflow = spaces.length - visible.length

  return (
    <div
      data-testid="account-workspaces"
      className="flex -space-x-1.5"
      title={spaces.map((space) => space.name).join(', ')}
    >
      {visible.map((space) => (
        <span key={space.uuid} className="ring-background inline-flex rounded-full ring-2">
          <InitialsAvatar name={space.name} size="xsmall" rounded />
        </span>
      ))}
      {overflow > 0 && (
        <span className="bg-muted text-muted-foreground ring-background flex size-5 items-center justify-center rounded-full text-[10px] ring-2">
          +{overflow}
        </span>
      )}
    </div>
  )
}
