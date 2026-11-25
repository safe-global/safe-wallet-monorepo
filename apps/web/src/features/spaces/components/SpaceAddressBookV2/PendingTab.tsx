import { useMemo, useState } from 'react'
import type {
  AddressBookRequestItemDto,
  SpaceAddressBookItemDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import TableCard from '@safe-global/views/components/common/TableCard'
import { SpaceLoadError, SpaceLoading } from '@safe-global/views/features/spaces/components/LoadState'
import AddressBookEmptyState from '@safe-global/views/features/spaces/components/AddressBookV2/AddressBookEmptyState'
import AddressBookToolbar from '@safe-global/views/features/spaces/components/AddressBookV2/AddressBookToolbar'
import PendingRequests from '@safe-global/views/features/spaces/components/AddressBookV2/PendingRequests'
import { searchPendingRequests } from './search'
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
  const [query, setQuery] = useState('')

  const rows = useMemo(
    () => toPendingRequests(requests.items, workspaceBook.items, configs, resolveMemberName),
    [requests.items, workspaceBook.items, configs, resolveMemberName],
  )
  const visibleRows = useMemo(() => searchPendingRequests(rows, query), [rows, query])

  const reload = () => {
    if (requests.isError) requests.refetch()
    if (workspaceBook.isError) workspaceBook.refetch()
  }

  if (requests.isLoading || workspaceBook.isLoading) {
    return (
      <TableCard>
        <SpaceLoading subject="pending requests" testId="pending-requests-loading" />
      </TableCard>
    )
  }

  if (requests.isError || workspaceBook.isError) {
    return (
      <TableCard>
        <SpaceLoadError onReload={reload} testId="pending-requests-error" />
      </TableCard>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.length > 0 && (
        <AddressBookToolbar query={query} onQueryChange={setQuery} searchScope="name, address or member" />
      )}

      <TableCard>
        {rows.length > 0 && visibleRows.length === 0 ? (
          <AddressBookEmptyState kind="no-results" book="pending" onClear={() => setQuery('')} />
        ) : (
          <PendingRequests
            requests={visibleRows}
            canReview={isAdmin}
            reviewingId={reviewingId}
            onApprove={approve}
            onReject={reject}
            {...addressCellProps}
          />
        )}
      </TableCard>
    </div>
  )
}

export default PendingTab
