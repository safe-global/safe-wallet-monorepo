import { Alert, AlertDescription } from '@safe-global/views/components/ui/alert'
import AlertIcon from '@safe-global/views/assets/images/notifications/info.svg'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export const SwapOrderExtraActionsWarning = ({ count }: { count: number }) => {
  return (
    <Alert data-testid="swap-extra-actions-warning" variant="warning" outlined={false} className="mb-2">
      <AlertIcon />
      <AlertDescription>
        <b>This transaction does more than this swap.</b>
        {` `}
        It also contains {count} other action{maybePlural(count)} that may move funds, such as transfers. Review every
        action before you sign.
      </AlertDescription>
    </Alert>
  )
}
