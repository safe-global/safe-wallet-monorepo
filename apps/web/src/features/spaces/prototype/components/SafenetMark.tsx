import { ShieldAlert, ShieldCheck, ShieldEllipsis } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { getSafenetCheck, SAFENET_LABELS } from '../services/safenet'
import type { Proposal } from '../types'
import { HINT_CLASS, HintContent } from './shared'

export const SAFENET_ICONS = {
  notStarted: ShieldEllipsis,
  checking: ShieldEllipsis,
  passed: ShieldCheck,
  risk: ShieldAlert,
}
export const SAFENET_TONES = {
  notStarted: 'text-muted-foreground',
  checking: 'text-muted-foreground',
  passed: 'text-success-strong',
  risk: 'text-warning-strong',
}

// The Safenet result next to the signatures. Checks start at the first signature, so there is nothing before it.
export function SafenetMark({ tx }: { tx: Proposal }) {
  const check = getSafenetCheck(tx)
  if (check === 'notStarted') return null
  const Icon = SAFENET_ICONS[check]
  return (
    <Tooltip delay={150}>
      <TooltipTrigger
        aria-label={`${SAFENET_LABELS[check]} (Safenet)`}
        className={`flex shrink-0 items-center ${SAFENET_TONES[check]}`}
        onClick={(event) => event.stopPropagation()}
      >
        <Icon className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent className={HINT_CLASS}>
        <HintContent title="Safenet" body={SAFENET_LABELS[check]} />
      </TooltipContent>
    </Tooltip>
  )
}
