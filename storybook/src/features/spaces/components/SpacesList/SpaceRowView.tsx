import type { ReactElement } from 'react'
import Link from 'next/link'
import { EllipsisVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Separator } from '@/components/ui/separator'
import { AppRoutes } from '@/config/routes'
import { SpaceSummary } from '@views/features/spaces/components/SpaceCard'
import { AdminOnlyWorkspaceTooltip } from '@views/features/spaces/components/AdminOnlyWorkspaceTooltip'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'

const MEMBER_NO_EDIT_MESSAGE = 'You need admin access to edit.'

export type SpaceRowViewProps = {
  uuid: string
  name: string
  safeCount: number
  memberCount: number
  hasPlan: boolean
  planName?: string
  isTrialing: boolean
  isAdmin: boolean
  showDivider: boolean
  onOpenWorkspace: () => void
  contextMenu: ReactElement
}

export const SpaceRowView = ({
  uuid,
  name,
  safeCount,
  memberCount,
  hasPlan,
  planName,
  isTrialing,
  isAdmin,
  showDivider,
  onOpenWorkspace,
  contextMenu,
}: SpaceRowViewProps) => {
  const badgeLabel = isTrialing ? 'Free access' : planName

  return (
    <>
      <div
        data-testid="space-row"
        className="relative isolate before:absolute before:-inset-x-3 before:inset-y-1 before:-z-10 before:rounded-md hover:before:bg-muted"
      >
        <Link
          href={{ pathname: AppRoutes.spaces.index, query: { spaceId: uuid } }}
          onClick={onOpenWorkspace}
          className="flex items-center gap-3 py-3 pr-10"
        >
          <InitialsAvatar name={name} size="medium" rounded />
          <div className="min-w-0 flex-1">
            <SpaceSummary name={name} numberOfAccounts={safeCount} numberOfMembers={memberCount} isCompact />
          </div>
          {hasPlan && (
            <Badge variant="subtle" size="status" shape="status" data-testid="space-row-pro-badge">
              <span className="block h-4 w-6">
                <ProChip className="size-full" />
              </span>
              {badgeLabel && `· ${badgeLabel}`}
            </Badge>
          )}
        </Link>

        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <AdminOnlyWorkspaceTooltip isAdmin={isAdmin} side="left" message={MEMBER_NO_EDIT_MESSAGE}>
            {isAdmin ? (
              contextMenu
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                data-testid="space-row-locked-actions"
                disabled
                aria-label={MEMBER_NO_EDIT_MESSAGE}
              >
                <EllipsisVertical className="text-muted-foreground" />
              </Button>
            )}
          </AdminOnlyWorkspaceTooltip>
        </div>
      </div>
      {showDivider && <Separator />}
    </>
  )
}
