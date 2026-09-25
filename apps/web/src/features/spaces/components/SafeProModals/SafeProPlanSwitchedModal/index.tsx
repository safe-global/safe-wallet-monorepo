import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { formatDate } from '@safe-global/utils/utils/date'
import SafeProModalFrame from '../SafeProModalFrame'
import { ProHighlight } from '@/components/common/ProHighlight'

/** Confirms a plan switched during the free access: nothing changes until it ends, then the new price applies. */
const SafeProPlanSwitchedModal = ({
  open,
  onOpenChange,
  planName,
  trialEndsAt,
  price,
  seatsLabel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  planName: string
  trialEndsAt: number | null
  /** Already formatted, e.g. "€189/mo". */
  price: string
  /** "5 Safe accounts": the seats the plan covers, shown as a chip under the title when known. */
  seatsLabel?: string
}) => (
  <SafeProModalFrame open={open} onOpenChange={onOpenChange}>
    <div className="flex flex-col items-center gap-3">
      <Typography variant="h4" as={DialogTitle}>
        You&apos;re on <ProHighlight>{planName}</ProHighlight>!
      </Typography>
      <Typography variant="paragraph-small" color="muted">
        Your free access continues{trialEndsAt !== null ? ` until ${formatDate(trialEndsAt)}` : ''}. After that,
        you&apos;ll pay {price}.
      </Typography>
      {seatsLabel && (
        <Badge variant="secondary" shape="tag" className="mt-1" data-testid="subscription-seats">
          {planName} · {seatsLabel}
        </Badge>
      )}
    </div>

    <Button accentIcon className="mt-2 min-w-64" onClick={() => onOpenChange(false)}>
      Get started
      <ArrowRight data-icon="inline-end" />
    </Button>
  </SafeProModalFrame>
)

export default SafeProPlanSwitchedModal
