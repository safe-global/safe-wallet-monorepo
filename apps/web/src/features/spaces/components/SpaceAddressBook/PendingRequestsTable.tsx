import { useState } from 'react'
import { useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import { isAddress } from 'ethers'
import EthHashInfo from '@/components/common/EthHashInfo'
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
import { useMemo } from 'react'

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
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'))
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

  if (requests.length === 0) {
    return <p className="text-muted-foreground text-sm">No pending requests.</p>
  }

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[20%]">Name</TableHead>
          <TableHead className={isSmallScreen ? 'w-[30%]' : 'w-[37%]'}>Address</TableHead>
          <TableHead className={isSmallScreen ? 'w-[15%]' : 'w-[8%]'}>Chains</TableHead>
          <TableHead className="w-[20%]">Requested by</TableHead>
          <TableHead className="w-[15%]" />
        </TableRow>
      </TableHeader>

      <TableBody>
        {requests.map((req) => (
          <TableRow key={req.id}>
            <TableCell className="font-bold">
              <span className="inline-flex items-center gap-2">
                <span className="min-w-0 truncate">{req.name}</span>
                {spaceAddresses.has(req.address.toLowerCase()) && (
                  <Tooltip>
                    <TooltipTrigger render={<Badge variant="outline">Already in workspace</Badge>} />
                    <TooltipContent>Approving replaces the existing workspace entry for this address.</TooltipContent>
                  </Tooltip>
                )}
              </span>
            </TableCell>

            <TableCell>
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
            </TableCell>

            <TableCell>
              <Tooltip>
                <TooltipTrigger>
                  <span className="inline-flex origin-left scale-85">
                    {chains.configs.length === req.chainIds.length ? (
                      <Badge variant="secondary">All</Badge>
                    ) : (
                      <NetworkLogosList
                        networks={req.chainIds.map((chainId) => ({ chainId }))}
                        showHasMore
                        maxVisible={3}
                      />
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
                <Tooltip>
                  <TooltipTrigger render={<span className="inline-flex min-w-0" />}>
                    {isAddress(req.requestedBy) ? (
                      <div className="text-[0.8em] font-mono">
                        <EthHashInfo
                          address={req.requestedBy}
                          shortAddress={false}
                          showPrefix={false}
                          showName={false}
                          highlight4bytes
                          showCopyButton={false}
                          avatarSize={20}
                        />
                      </div>
                    ) : (
                      <EthHashInfo
                        address={req.requestedBy}
                        avatarSize={20}
                        onlyName
                        showPrefix={false}
                        showCopyButton={false}
                      />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>{req.requestedBy}</TooltipContent>
                </Tooltip>
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
