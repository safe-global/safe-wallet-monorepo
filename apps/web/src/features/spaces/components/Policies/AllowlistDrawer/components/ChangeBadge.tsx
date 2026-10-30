import type { ReactElement } from 'react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { CHANGE_BADGE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/Summary/constants'
import type { AllowlistItemChange } from '@safe-global/views/features/spaces/components/Policies/types'

type ChangeBadgeProps = {
  change: AllowlistItemChange
  /** In a list row, reserves the summary card's chevron width so every badge lines up. */
  alignWithChevron?: boolean
}

const ChangeBadge = ({ change, alignWithChevron = false }: ChangeBadgeProps): ReactElement => (
  <>
    <Badge variant={CHANGE_BADGE[change].variant} className="w-20 shrink-0 justify-center">
      {CHANGE_BADGE[change].label}
    </Badge>
    {alignWithChevron && <span className="size-4 shrink-0" aria-hidden />}
  </>
)

export default ChangeBadge
