import { useMemo } from 'react'
import type {
  AddressBookRequestItemDto,
  SpaceAddressBookItemDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import TableCard from '@safe-global/views/components/common/TableCard'
import { SpaceLoadError, SpaceLoading } from '@safe-global/views/features/spaces/components/LoadState'
import PendingRequests from '@safe-global/views/features/spaces/components/AddressBookV2/PendingRequests'
import useChains from '@/hooks/useChains'
import { useAddressBookRequestActions } from '../../hooks/useAddressBookRequestActions'
import { useMemberNameResolver } from '../../public/hooks/useMemberNameResolver'
import useAddressCellProps from './useAddressCellProps'
import { toPendingRequests } from './utils'

type LoadState<T> = { items: T[]; isLoading: boolean; isError: boolean; refetch: () => void }

type PendingTabProps = {
  requests: LoadState<AddressBookRequestItemDto>
  /** Read before Accept is offered, so "Already in Workspace" can warn about an overwrite. */
  workspaceBook: LoadState<SpaceAddressBookItemDto>
  isAdmin: boolean
}

const PendingTab = ({ requests, workspaceBook, isAdmin }: PendingTabProps) => {
  const { configs } = useChains()
  const resolveMemberName = useMemberNameResolver()
  const addressCellProps = useAddressCellProps()
  const { approve, reject, reviewingId } = useAddressBookRequestActions()

  const rows = useMemo(
    () => toPendingRequests(requests.items, workspaceBook.items, configs, resolveMemberName),
    [requests.items, workspaceBook.items, configs, resolveMemberName],
  )

  const reload = () => {
    if (requests.isError) {
      requests.refetch()
    }
    if (workspaceBook.isError) {
      workspaceBook.refetch()
    }
  }

  return (
    <TableCard>
      {requests.isLoading || workspaceBook.isLoading ? (
        <SpaceLoading subject="pending requests" testId="pending-requests-loading" />
      ) : requests.isError || workspaceBook.isError ? (
        <SpaceLoadError onReload={reload} testId="pending-requests-error" />
      ) : (
        <PendingRequests
          requests={rows}
          canReview={isAdmin}
          reviewingId={reviewingId}
          onApprove={approve}
          onReject={reject}
          {...addressCellProps}
        />
      )}
    </TableCard>
  )
}

export default PendingTab
