import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import EthHashInfo from '@/components/common/EthHashInfo'
import { NetworkLogosList } from '@/features/multichain'
import ChainIndicator from '@/components/common/ChainIndicator'
import type { AddressBookRequestItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  useAddressBookRequestsApproveRequestV1Mutation,
  useAddressBookRequestsRejectRequestV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId, useIsAdmin } from '@/features/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import useChains from '@/hooks/useChains'
import { Check, X } from 'lucide-react'

type PendingRequestsTableProps = {
  requests: AddressBookRequestItemDto[]
}

function PendingRequestsTable({ requests }: PendingRequestsTableProps) {
  const chains = useChains()
  const isAdmin = useIsAdmin()
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [approveRequest] = useAddressBookRequestsApproveRequestV1Mutation()
  const [rejectRequest] = useAddressBookRequestsRejectRequestV1Mutation()
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const handleApprove = async (requestId: number) => {
    if (!spaceId) return
    setLoadingId(requestId)
    try {
      const result = await approveRequest({ spaceId: spaceId ?? '', requestId })
      if (result.error) {
        dispatch(
          showNotification({ message: 'Failed to approve request', variant: 'error', groupKey: 'approve-error' }),
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

  if (requests.length === 0) {
    return <p className="text-muted-foreground text-sm">No pending requests.</p>
  }

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[20%]">Name</TableHead>
          <TableHead className="w-[30%]">Address</TableHead>
          <TableHead className="w-[15%]">Chains</TableHead>
          <TableHead className="w-[20%]">Requested by</TableHead>
          <TableHead className="w-[15%]" />
        </TableRow>
      </TableHeader>

      <TableBody>
        {requests.map((req) => (
          <TableRow key={req.id}>
            <TableCell className="font-bold">{req.name}</TableCell>

            <TableCell>
              <div className="text-[0.8em]">
                <EthHashInfo
                  address={req.address}
                  shortAddress={false}
                  showPrefix={false}
                  showName={false}
                  hasExplorer
                  showCopyButton
                  avatarSize={24}
                />
              </div>
            </TableCell>

            <TableCell>
              <Tooltip>
                <TooltipTrigger>
                  <span className="inline-flex origin-left scale-85">
                    {chains.configs.length === req.chainIds.length ? (
                      <Badge variant="secondary">All</Badge>
                    ) : (
                      <NetworkLogosList networks={req.chainIds.map((chainId) => ({ chainId }))} />
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
            </TableCell>

            <TableCell>
              {req.requestedBy && (
                <EthHashInfo
                  address={req.requestedBy}
                  avatarSize={20}
                  onlyName
                  showPrefix={false}
                  showCopyButton={false}
                />
              )}
            </TableCell>

            <TableCell className="text-right">
              {isAdmin ? (
                <span className="inline-flex gap-1">
                  {loadingId === req.id ? (
                    <Spinner className="size-5" />
                  ) : (
                    <>
                      <Button variant="outline" size="icon-sm" onClick={() => handleApprove(req.id)} title="Accept">
                        <Check className="size-4" />
                      </Button>
                      <Button variant="outline" size="icon-sm" onClick={() => handleReject(req.id)} title="Reject">
                        <X className="size-4" />
                      </Button>
                    </>
                  )}
                </span>
              ) : (
                <Badge variant="secondary">Pending</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default PendingRequestsTable
