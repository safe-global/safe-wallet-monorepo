import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'

const ALL_SAFE_PAID_TOOLTIP =
  "Bulk execution is not available when all ready transactions pay fees from the Safe. You'd pay gas twice, once from the Safe and once from your signer wallet."

const NOT_BATCHABLE_TOOLTIP =
  'Batch execution is only available for transactions that have been fully signed and are strictly sequential in Safe account nonce.'

const BATCHABLE_TOOLTIP = 'All highlighted transactions will be included in the batch execution.'

export type BatchExecuteButtonViewProps = {
  isBatchable: boolean
  batchCount: number
  isDisabled: boolean
  allSafePaid: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
  showMixedWarning: boolean
  safePaidCount: number
  onCloseMixedWarning: () => void
  renderDialogActions: (props: { confirmLabel: string }) => ReactNode
}

export const BatchExecuteButtonView = ({
  isBatchable,
  batchCount,
  isDisabled,
  allSafePaid,
  onMouseEnter,
  onMouseLeave,
  onClick,
  showMixedWarning,
  safePaidCount,
  onCloseMixedWarning,
  renderDialogActions,
}: BatchExecuteButtonViewProps) => {
  const tooltipTitle = allSafePaid ? ALL_SAFE_PAID_TOOLTIP : isDisabled ? NOT_BATCHABLE_TOOLTIP : BATCHABLE_TOOLTIP

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <span>
              <Button
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                variant="outline"
                size="action"
                disabled={isDisabled}
                onClick={onClick}
              >
                Bulk execute{isBatchable && ` ${batchCount} transactions`}
              </Button>
            </span>
          }
        />
        <TooltipContent side="top" align="start">
          {tooltipTitle}
        </TooltipContent>
      </Tooltip>

      {showMixedWarning && (
        <AlertDialog open onOpenChange={(open) => !open && onCloseMixedWarning()}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <div className="flex items-center justify-center size-10 rounded-full bg-[var(--color-warning-main)]/10 text-[var(--color-warning-main)] shrink-0">
                <TriangleAlert className="size-5" />
              </div>
              <AlertDialogTitle>Some transactions will be charged gas twice</AlertDialogTitle>
              <AlertDialogDescription>
                {safePaidCount} {safePaidCount === 1 ? 'transaction' : 'transactions'} in this batch{' '}
                {safePaidCount === 1 ? 'pays' : 'pay'} gas fees from the Safe. Those fees will still be deducted from
                the Safe, and your signer wallet will also pay gas to execute the batch. You&apos;ll pay gas twice on
                those transactions.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>{renderDialogActions({ confirmLabel: 'Execute anyway' })}</AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
