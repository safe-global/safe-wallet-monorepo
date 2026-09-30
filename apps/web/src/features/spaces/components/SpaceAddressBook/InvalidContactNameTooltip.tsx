import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getRenameContactTooltip } from './utils'

const InvalidContactNameTooltip = ({ nameError, children }: { nameError: string; children: ReactNode }) => (
  <Tooltip>
    <TooltipTrigger render={<div className="inline-flex w-fit" />}>{children}</TooltipTrigger>
    <TooltipContent>{getRenameContactTooltip(nameError)}</TooltipContent>
  </Tooltip>
)

export default InvalidContactNameTooltip
