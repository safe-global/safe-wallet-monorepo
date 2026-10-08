import type { ReactElement, ReactNode } from 'react'
import DeleteIcon from '@/public/images/common/delete.svg'
import { Button } from '@/components/ui/button'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics/events/modals'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { X } from 'lucide-react'

export type RecipientRowViewProps = {
  addressInput: ReactNode
  tokenAmountInput: ReactNode
  showFeeBanner: boolean
  feeTokenSymbol?: string
  onDismissFeeBanner: () => void
  showSpendingLimit: boolean
  spendingLimitRow: ReactNode
  removable: boolean
  onRemove: () => void
}

export const RecipientRowView = ({
  addressInput,
  tokenAmountInput,
  showFeeBanner,
  feeTokenSymbol,
  onDismissFeeBanner,
  showSpendingLimit,
  spendingLimitRow,
  removable,
  onRemove,
}: RecipientRowViewProps): ReactElement => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-4">
        <div className="w-full">{addressInput}</div>

        <div className="w-full">{tokenAmountInput}</div>

        {showFeeBanner && (
          <Alert data-testid="gtf-fee-banner" variant="info" className="items-center">
            <AlertSeverityIcon variant="info" />
            <AlertDescription className="flex w-full items-center justify-between gap-2">
              <span>Your max send amount accounts for fees paid in {feeTokenSymbol}. This updates if fees change.</span>
              <Button variant="ghost" size="icon-sm" aria-label="Dismiss fee banner" onClick={onDismissFeeBanner}>
                <X className="size-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {showSpendingLimit && <div className="w-full">{spendingLimitRow}</div>}
      </div>

      {removable && (
        <div>
          <Track {...MODALS_EVENTS.REMOVE_RECIPIENT}>
            <Button
              data-testid="remove-recipient-btn"
              onClick={onRemove}
              aria-label="Remove recipient"
              variant="ghost"
              size="lg"
            >
              <DeleteIcon className="size-4" />
              Remove recipient
            </Button>
          </Track>
        </div>
      )}
    </div>
  )
}
