import type { ReactElement } from 'react'
import PendingDelegation from './PendingDelegation'
import { usePendingDelegations } from '../hooks/usePendingDelegations'
import { PendingDelegationsListView } from '@views/features/proposers/components/PendingDelegationsListView'

function PendingDelegationsList(): ReactElement | null {
  const { pendingDelegations, isLoading, refetch } = usePendingDelegations()

  if (isLoading || pendingDelegations.length === 0) return null

  return (
    <PendingDelegationsListView
      pendingDelegations={pendingDelegations}
      onRetry={refetch}
      renderDelegation={(delegation) => <PendingDelegation delegation={delegation} onRefetch={refetch} />}
    />
  )
}

export default PendingDelegationsList
