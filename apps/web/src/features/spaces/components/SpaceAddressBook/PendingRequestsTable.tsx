import { useState, useMemo } from 'react'
import { isAddress } from 'ethers'
import EthHashInfo from '@/components/common/EthHashInfo'
import ChainIndicator from '@/components/common/ChainIndicator'
import type { AddressBookRequestItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  useAddressBookRequestsApproveRequestV1Mutation,
  useAddressBookRequestsRejectRequestV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId, useGetSpaceAddressBook, useIsAdmin } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import useChains from '@/hooks/useChains'
import AddressCell from '@views/features/spaces/components/SpaceAddressBook/AddressCell'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import { PendingRequestsTableView } from '@views/features/spaces/components/SpaceAddressBook/PendingRequestsTableView'

type PendingRequestsTableProps = {
  requests: AddressBookRequestItemDto[]
}

const getApproveErrorMessage = (error: unknown): string => {
  const err = error as { data?: { message?: string } }
  return typeof err?.data?.message === 'string' ? err.data.message : 'Failed to approve request'
}

function PendingRequestsTable({ requests }: PendingRequestsTableProps) {
  const chains = useChains()
  const isAdmin = useIsAdmin()
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const spaceAddressBook = useGetSpaceAddressBook()
  const [approveRequest] = useAddressBookRequestsApproveRequestV1Mutation()
  const [rejectRequest] = useAddressBookRequestsRejectRequestV1Mutation()
  const [loadingId, setLoadingId] = useState<number | null>(null)

  // Approving a request for an address that is already in the workspace book
  // overwrites the existing entry, so admins get a warning badge.
  const spaceAddresses = useMemo(
    () => new Set(spaceAddressBook.map((item) => item.address.toLowerCase())),
    [spaceAddressBook],
  )

  const handleApprove = async (requestId: number) => {
    if (!spaceId) return
    setLoadingId(requestId)
    try {
      const result = await approveRequest({ spaceId: spaceId ?? '', requestId })
      if (isElevationRequiredError(result.error)) return
      if (result.error) {
        dispatch(
          showNotification({
            message: getApproveErrorMessage(result.error),
            variant: 'error',
            groupKey: 'approve-error',
          }),
        )
        return
      }
      trackEvent(SPACE_EVENTS.ADDRESS_REQUEST_APPROVED)
      dispatch(
        showNotification({
          message: 'Contact added to Workspace address book',
          variant: 'success',
          groupKey: 'approve-success',
        }),
      )
    } catch {
      dispatch(showNotification({ message: 'Something went wrong', variant: 'error', groupKey: 'approve-error' }))
    } finally {
      setLoadingId(null)
    }
  }

  const handleReject = async (requestId: number) => {
    if (!spaceId) return
    setLoadingId(requestId)
    try {
      const result = await rejectRequest({ spaceId: spaceId ?? '', requestId })
      if (result.error) {
        dispatch(showNotification({ message: 'Failed to reject request', variant: 'error', groupKey: 'reject-error' }))
        return
      }
      trackEvent(SPACE_EVENTS.ADDRESS_REQUEST_REJECTED)
      dispatch(showNotification({ message: 'Request rejected', variant: 'success', groupKey: 'reject-success' }))
    } catch {
      dispatch(showNotification({ message: 'Something went wrong', variant: 'error', groupKey: 'reject-error' }))
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <PendingRequestsTableView
      requests={requests}
      allChainsCount={chains.configs.length}
      isAdmin={isAdmin}
      spaceAddresses={spaceAddresses}
      loadingId={loadingId}
      onApprove={handleApprove}
      onReject={handleReject}
      isWalletAddress={isAddress}
      renderAddressCell={(address, isCompact) => <AddressCell address={address} isCompact={isCompact} />}
      renderRequesterHashInfo={(address) => (
        <EthHashInfo
          address={address}
          shortAddress={false}
          showPrefix={false}
          showName={false}
          highlight4bytes
          showCopyButton={false}
          avatarSize={20}
        />
      )}
      renderChainIndicator={(chainId) => <ChainIndicator key={chainId} chainId={chainId} />}
    />
  )
}

export default PendingRequestsTable
