import type { ReactElement } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useAppDispatch } from '@/store'
import { ESafeAction, openSafeActionsModal } from '../../../store'

const NewTransactionButton = ({ spaceId }: { spaceId: string }): ReactElement => {
  const dispatch = useAppDispatch()

  const onClick = () => {
    trackEvent(SPACE_EVENTS.TRANSACTION_INITIATED, {
      workspace_id: spaceId,
      action: 'new_transaction',
      entry_point: 'space_transactions',
    })
    dispatch(openSafeActionsModal({ type: ESafeAction.NewTransaction }))
  }

  return (
    <Button onClick={onClick} aria-label="New transaction">
      <Plus />
      New
    </Button>
  )
}

export default NewTransactionButton
