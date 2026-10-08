import type { ReactElement } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import WarningIcon from '@/public/images/notifications/warning.svg'

const RecoveryInfo = ({ isMalicious }: { isMalicious: boolean }): ReactElement | null => {
  if (!isMalicious) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>
        <WarningIcon className="size-6 fill-current text-[var(--color-error-main)]" />
      </TooltipTrigger>
      <TooltipContent side="top">Suspicious activity</TooltipContent>
    </Tooltip>
  )
}

export default RecoveryInfo
