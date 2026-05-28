import type { ReactElement, ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import type { SpaceMemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { isUserActiveAdmin } from '@/features/spaces/utils'

export const ADMIN_ONLY_WORKSPACE_TOOLTIP_MESSAGE = 'Only admins can add Safes to this workspace'

type Side = 'top' | 'right' | 'bottom' | 'left'

interface AdminOnlyWorkspaceTooltipProps {
  children: ReactElement
  /** Members of the workspace. Used to derive admin status against the current user. Ignored when `isAdmin` is provided. */
  members?: SpaceMemberDto[]
  /** Explicit admin flag. Takes precedence over `members` when provided. */
  isAdmin?: boolean
  side?: Side
  /** Optional override for the tooltip message. */
  message?: ReactNode
}

/**
 * Wraps `children` in a tooltip that explains why the current user cannot add a Safe
 * to the given workspace. When the user is an active admin of the workspace, renders
 * `children` unchanged.
 */
export const AdminOnlyWorkspaceTooltip = ({
  children,
  members,
  isAdmin,
  side = 'right',
  message = ADMIN_ONLY_WORKSPACE_TOOLTIP_MESSAGE,
}: AdminOnlyWorkspaceTooltipProps): ReactElement => {
  const isSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, {
    skip: !isSignedIn || isAdmin !== undefined,
  })
  const userIsAdmin = isAdmin ?? isUserActiveAdmin(members ?? [], currentUser?.id)

  if (userIsAdmin) return children

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="block w-full" />}>{children}</TooltipTrigger>
      <TooltipContent side={side}>{message}</TooltipContent>
    </Tooltip>
  )
}
