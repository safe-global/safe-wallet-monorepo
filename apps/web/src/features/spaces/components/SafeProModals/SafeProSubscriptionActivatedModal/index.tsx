import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import SafeProModalFrame from '../SafeProModalFrame'
import { ProHighlight } from '@/components/common/ProHighlight'

const SafeProSubscriptionActivatedModal = ({
  open,
  onOpenChange,
  planName,
  seatsLabel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  planName: string
  /** "5 Safe accounts": the seats the plan covers, shown as a chip under the title when known. */
  seatsLabel?: string
}) => (
  <SafeProModalFrame open={open} onOpenChange={onOpenChange}>
    <div className="flex flex-col items-center gap-4">
      <Typography variant="h4" as={DialogTitle}>
        Your paid subscription is active, you&apos;re on <ProHighlight>{planName}</ProHighlight>!
      </Typography>
      {seatsLabel && (
        <Badge variant="secondary" shape="tag" data-testid="subscription-seats">
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

export default SafeProSubscriptionActivatedModal
