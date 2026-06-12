import BatchIcon from '@/public/images/common/batch.svg'
import { Badge } from '@/components/ui/badge'
import { useDraftBatch } from '@/features/batching'
import Track from '@/components/common/Track'
import { BATCH_EVENTS } from '@/services/analytics'
import BatchTooltip from './BatchTooltip'

/**
 * @deprecated Used only by the legacy MUI Header (`components/common/Header/index.tsx`).
 * Remove this entire directory once the Header migration to TopBar is complete.
 */
const BatchIndicator = ({ onClick }: { onClick?: () => void }) => {
  const { length } = useDraftBatch()

  return (
    <BatchTooltip>
      <Track {...BATCH_EVENTS.BATCH_SIDEBAR_OPEN} label={length}>
        <button
          type="button"
          title="Batch"
          onClick={onClick}
          className="relative inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-2.5 hover:rounded-md hover:bg-[var(--color-background-light)]"
        >
          <BatchIcon className="size-6" />
          {length > 0 && (
            <Badge variant="secondary" className="absolute right-1 bottom-1 translate-x-1/2 translate-y-1/2">
              {length}
            </Badge>
          )}
        </button>
      </Track>
    </BatchTooltip>
  )
}

export default BatchIndicator
