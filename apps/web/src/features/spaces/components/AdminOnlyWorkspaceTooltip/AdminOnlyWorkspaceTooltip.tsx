import type { ReactElement, ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const ADMIN_ONLY_WORKSPACE_TOOLTIP_MESSAGE = 'Only admins can add Safes to this workspace'

type Side = 'top' | 'right' | 'bottom' | 'left'

interface AdminOnlyWorkspaceTooltipProps {
  children: ReactElement
  isAdmin: boolean
  side?: Side
  message?: ReactNode
}

export const AdminOnlyWorkspaceTooltip = ({
  children,
  isAdmin,
  side = 'right',
  message = ADMIN_ONLY_WORKSPACE_TOOLTIP_MESSAGE,
}: AdminOnlyWorkspaceTooltipProps): ReactElement => {
  if (isAdmin) return children

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="block w-full" />}>{children}</TooltipTrigger>
      <TooltipContent side={side}>{message}</TooltipContent>
    </Tooltip>
  )
}
