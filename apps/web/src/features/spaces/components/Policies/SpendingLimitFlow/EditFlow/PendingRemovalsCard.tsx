import type { ReactElement } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import type { RemovalCopy } from '../utils/removals'
import { DISCARD_CHANGES_LABEL } from '../constants'

export type PendingRemovalsCardProps = {
  /** What would go, in words. */
  copy: RemovalCopy
  /** Restores the policy the chain holds, undoing every removal at once. */
  onDiscard: () => void
}

/**
 * Stands where the removed rows were, so an edit never takes a limit away silently.
 *
 * Styled as a spender card rather than as a warning: nothing has happened on chain yet, and the
 * signer still has to read the confirm step.
 */
const PendingRemovalsCard = ({ copy, onDiscard }: PendingRemovalsCardProps): ReactElement => (
  <Card variant="muted" size="none" radius="xl" data-testid="pending-removals">
    {/* `Card` takes spacing only through `size`/`radius`, so the padding lives on this div. */}
    <div className="flex flex-col items-center gap-3 p-4 text-center">
      <span className="flex size-9 items-center justify-center rounded-full bg-border">
        <Trash2 className="size-[18px] text-muted-foreground" aria-hidden />
      </span>

      <div className="flex max-w-[26rem] flex-col gap-1">
        <Typography variant="paragraph-bold">{copy.title}</Typography>
        <Typography variant="paragraph-small" className="text-muted-foreground">
          {copy.description}
        </Typography>
      </div>

      <Button type="button" variant="outline" onClick={onDiscard}>
        <RotateCcw />
        {DISCARD_CHANGES_LABEL}
      </Button>
    </div>
  </Card>
)

export default PendingRemovalsCard
