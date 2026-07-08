import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import { isAddress } from 'ethers'
import EthHashInfo from '@/components/common/EthHashInfo'
import Identicon from '@/components/common/Identicon'
import { NetworkLogosList } from '@/features/multichain'
import ChainIndicator from '@/components/common/ChainIndicator'
import type { AddressBookRequestItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  useAddressBookRequestsApproveRequestV1Mutation,
  useAddressBookRequestsRejectRequestV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId, useGetSpaceAddressBook, useIsAdmin } from '@/features/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import useChains from '@/hooks/useChains'
import { Check, X } from 'lucide-react'
import PaginatedDataTable, { type DataTableColumn } from '../PaginatedDataTable'

type PendingRequestsTableProps = {
  requests: AddressBookRequestItemDto[]
}

const getApproveErrorMessage = (error: unknown): string => {
  const err = error as { data?: { message?: string } }
  return typeof err?.data?.message === 'string' ? err.data.message : 'Failed to approve request'
}

function RequestedBy({ requestedBy }: { requestedBy: string }) {
  if (isAddress(requestedBy)) {
    return (
      <div className="text-[0.8em] font-mono">
        <EthHashInfo
          address={requestedBy}
          shortAddress={false}
          showPrefix={false}
          showName={false}
          highlight4bytes
          showCopyButton={false}
          avatarSize={20}
        />
      </div>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="shrink-0">
              <Identicon address={requestedBy} size={20} />
            </span>
            <span className="min-w-0 truncate text-left">{requestedBy}</span>
          </span>
        }
      />
      <TooltipContent side="bottom">{requestedBy}</TooltipContent>
    </Tooltip>
  )
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
      dispatch(
        showNotification({
          message: 'Contact added to workspace address book',
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
      dispatch(showNotification({ message: 'Request rejected', variant: 'success', groupKey: 'reject-success' }))
    } catch {
      dispatch(showNotification({ message: 'Something went wrong', variant: 'error', groupKey: 'reject-error' }))
    } finally {
      setLoadingId(null)
    }
  }

  const renderChains = (req: AddressBookRequestItemDto) => (
    <Tooltip>
      <TooltipTrigger>
        <span className="inline-flex origin-left scale-85">
          {chains.configs.length === req.chainIds.length ? (
            <Badge variant="secondary">All</Badge>
          ) : (
            <NetworkLogosList networks={req.chainIds.map((chainId) => ({ chainId }))} showHasMore maxVisible={3} />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col gap-1">
          {req.chainIds.map((chainId) => (
            <ChainIndicator key={chainId} chainId={chainId} />
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )

  const columns: DataTableColumn<AddressBookRequestItemDto>[] = [
    {
      id: 'name',
      header: 'Name',
      width: '20%',
      sticky: true,
      minWidth: 140,
      emphasis: 'strong',
      cell: (req) => (
        <span className="inline-flex min-w-0 items-center gap-2 overflow-hidden">
          <span className="min-w-0 truncate">{req.name}</span>
          {spaceAddresses.has(req.address.toLowerCase()) && (
            <Tooltip>
              <TooltipTrigger render={<Badge variant="outline">Already in workspace</Badge>} />
              <TooltipContent>Approving replaces the existing workspace entry for this address.</TooltipContent>
            </Tooltip>
          )}
        </span>
      ),
    },
    {
      id: 'address',
      header: 'Address',
      width: '30%',
      minWidth: 360,
      cell: (req) => (
        <div className="text-[0.8em] font-mono">
          <EthHashInfo
            address={req.address}
            shortAddress={false}
            showPrefix={false}
            showName={false}
            highlight4bytes
            hasExplorer
            showCopyButton
            avatarSize={24}
          />
        </div>
      ),
    },
    {
      id: 'chains',
      header: 'Chains',
      width: '15%',
      priority: 'secondary',
      minWidth: 100,
      cell: renderChains,
    },
    {
      id: 'requestedBy',
      header: 'Requested by',
      width: '30%',
      priority: 'secondary',
      minWidth: 300,
      cell: (req) => (req.requestedBy ? <RequestedBy requestedBy={req.requestedBy} /> : null),
    },
    {
      id: 'actions',
      width: '15%',
      align: 'end',
      minWidth: 80,
      cell: (req) =>
        isAdmin ? (
          <span className="inline-flex items-center justify-end gap-1">
            {loadingId === req.id ? (
              <Spinner className="size-5" />
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger render={<span className="inline-flex" />}>
                    <Button variant="outline" size="icon-sm" onClick={() => handleApprove(req.id)}>
                      <Check className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Accept</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger render={<span className="inline-flex" />}>
                    <Button variant="outline" size="icon-sm" onClick={() => handleReject(req.id)}>
                      <X className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Decline</TooltipContent>
                </Tooltip>
              </>
            )}
          </span>
        ) : (
          <Badge variant="secondary">Pending</Badge>
        ),
    },
  ]

  // Surfaces the columns hidden on mobile (chains, requested-by)
  const renderRowDetail = (req: AddressBookRequestItemDto) => (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground w-24 shrink-0">Chains</span>
        <div className="flex flex-wrap gap-1">
          {req.chainIds.map((chainId) => (
            <ChainIndicator key={chainId} chainId={chainId} />
          ))}
        </div>
      </div>
      {req.requestedBy && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-24 shrink-0">Requested by</span>
          <RequestedBy requestedBy={req.requestedBy} />
        </div>
      )}
    </div>
  )

  if (requests.length === 0) {
    return <p className="text-muted-foreground text-sm">No pending requests.</p>
  }

  return (
    <PaginatedDataTable
      columns={columns}
      rows={requests}
      getRowKey={(req) => String(req.id)}
      renderRowDetail={renderRowDetail}
    />
  )
}

export default PendingRequestsTable
