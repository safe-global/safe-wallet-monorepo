import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export type ClearPendingTxsViewProps = {
  pendingTxCount: number
  onClear: () => void
}

export const ClearPendingTxsView = ({ pendingTxCount, onClear }: ClearPendingTxsViewProps) => {
  return (
    <div className="flex flex-col gap-4">
      <Typography>Clear this Safe account&apos;s pending transactions.</Typography>
      <Alert variant="warning" outlined={false}>
        <AlertSeverityIcon variant="warning" />
        <AlertDescription>
          This action does not delete any transactions but only resets their local state. It does not stop any pending
          transactions from executing. If you want to cancel an execution, you have to do so in your connected wallet.
        </AlertDescription>
      </Alert>
      <div>
        {pendingTxCount > 0 ? (
          <Button variant="destructive" onClick={onClear}>
            Clear {pendingTxCount} transaction{maybePlural(pendingTxCount)}
          </Button>
        ) : (
          <Typography variant="paragraph-small">No pending transactions</Typography>
        )}
      </div>
    </div>
  )
}
