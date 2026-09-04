import type { ReactElement } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { CLOUD_COSIGNER_DESCRIPTION, CLOUD_COSIGNER_NAME } from '../../constants'

/** Marks an owner address as the cloud cosigner. */
const CloudCosignerBadge = ({ className }: { className?: string }): ReactElement => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge data-testid="cloud-cosigner-badge" variant="secondary" className={cn('shrink-0', className)}>
            {CLOUD_COSIGNER_NAME}
          </Badge>
        }
      />
      <TooltipContent>{CLOUD_COSIGNER_DESCRIPTION}</TooltipContent>
    </Tooltip>
  )
}

export default CloudCosignerBadge
