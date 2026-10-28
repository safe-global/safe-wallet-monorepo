import type { ReactElement } from 'react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { CHANGE_BADGE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/Summary/constants'

/** In a list row, `alignWithChevron` reserves the summary card's chevron width so every badge lines up. */
const RemovedBadge = ({ alignWithChevron = false }: { alignWithChevron?: boolean }): ReactElement => (
  <>
    <Badge variant={CHANGE_BADGE.removed.variant} className="w-20 shrink-0 justify-center">
      {CHANGE_BADGE.removed.label}
    </Badge>
    {alignWithChevron && <span className="size-4 shrink-0" aria-hidden />}
  </>
)

export default RemovedBadge
