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

type PendingTabProps = {
  requests: AddressBookRequestItemDto[]
  workspaceItems: SpaceAddressBookItemDto[]
  isLoading: boolean
  isError: boolean
  onReload: () => void
  isAdmin: boolean
}

const PendingTab = ({ requests, workspaceItems, isLoading, isError, onReload, isAdmin }: PendingTabProps) => {
  const { configs } = useChains()
  const resolveMemberName = useMemberNameResolver()
  const addressCellProps = useAddressCellProps()
  const { approve, reject, reviewingId } = useAddressBookRequestActions()

  const rows = useMemo(
    () => toPendingRequests(requests, workspaceItems, configs, resolveMemberName),
    [requests, workspaceItems, configs, resolveMemberName],
  )

  return (
    <TableCard>
      {isLoading ? (
        <SpaceLoading subject="pending requests" testId="pending-requests-loading" />
      ) : isError ? (
        <SpaceLoadError onReload={onReload} testId="pending-requests-error" />
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
