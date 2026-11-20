import { Button } from '@safe-global/views/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Typography } from '@safe-global/views/components/ui/typography'
import { highlightSafePro } from '@safe-global/views/components/common/ProHighlight'
import type { PlanPick, PlanTier } from '@safe-global/views/features/spaces/components/Plans/types'
import { PlanLocation } from '@/services/analytics/mixpanel-events'
// eslint-disable-next-line no-restricted-imports -- prototype: the same plan cards as the Plans page
import { PlanCatalog } from '@/features/spaces/components/Plans/PlanCatalog'

export const TryProModal = ({
  tiers,
  reason,
  onClose,
  onPick,
}: {
  /** Plan tiers as the Plans page builds them, both billing cycles. */
  tiers: PlanTier[]
  /** One line on why the user is seeing this, from the prompt that opened it. */
  reason?: string
  onClose: () => void
  onPick?: (pick: PlanPick) => void
}) => (
  <Dialog open onOpenChange={(open) => !open && onClose()}>
    <DialogContent
      size="lg"
      surface="card"
      padding="sm"
      className="flex max-h-[90vh] flex-col"
      data-testid="try-pro-modal"
    >
      <div className="flex min-h-0 flex-col gap-6 pt-5">
        <div className="flex flex-col gap-1">
          <Typography variant="h3" as={DialogTitle}>
            {highlightSafePro('Try Safe Pro')}
          </Typography>
          {reason && <Typography color="muted">{reason}</Typography>}
        </div>

        <div className="-mx-1 min-h-0 overflow-y-auto px-1">
          <PlanCatalog embedded tiers={tiers} onSubscribe={onPick} location={PlanLocation.LOCKED_MODAL} />
        </div>

        <Button variant="ghost-muted" size="sm" className="self-center" onClick={onClose}>
          Not now
        </Button>
      </div>
    </DialogContent>
  </Dialog>
)
