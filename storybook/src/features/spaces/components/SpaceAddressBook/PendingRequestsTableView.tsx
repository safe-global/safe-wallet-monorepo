import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import Identicon from '@/components/common/Identicon'
import NetworkLogosPill from '@/features/multichain/components/NetworkLogosPill'
import NetworkLogosTooltip from '@/features/multichain/components/NetworkLogosTooltip'
import type { AddressBookRequestItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Check, X } from 'lucide-react'
import PaginatedDataTable, { type DataTableColumn } from '@/components/common/PaginatedDataTable'
import { cn } from '@/utils/cn'

export type PendingRequestsTableViewProps = {
  requests: AddressBookRequestItemDto[]
  allChainsCount: number
  isAdmin: boolean
  spaceAddresses: Set<string>
  loadingId: number | null
  onApprove: (requestId: number) => void
  onReject: (requestId: number) => void
  isWalletAddress: (value: string) => boolean
  renderAddressCell: (address: string, isCompact?: boolean) => ReactNode
  renderRequesterHashInfo: (address: string) => ReactNode
  renderChainIndicator: (chainId: string) => ReactNode
}

function RequestedBy({
  requestedBy,
  isWalletAddress,
  renderRequesterHashInfo,
}: {
  requestedBy: string
  isWalletAddress: (value: string) => boolean
  renderRequesterHashInfo: (address: string) => ReactNode
}) {
  if (isWalletAddress(requestedBy)) {
    return <div className="text-[0.8em] font-mono">{renderRequesterHashInfo(requestedBy)}</div>
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

export function PendingRequestsTableView({
  requests,
  allChainsCount,
  isAdmin,
  spaceAddresses,
  loadingId,
  onApprove,
  onReject,
  isWalletAddress,
  renderAddressCell,
  renderRequesterHashInfo,
  renderChainIndicator,
}: PendingRequestsTableViewProps) {
  // The "All" badge stands on its own; logo stacks get the standard grey pill.
  const renderChains = (req: AddressBookRequestItemDto) =>
    allChainsCount === req.chainIds.length ? (
      <NetworkLogosTooltip
        networks={req.chainIds.map((chainId) => ({ chainId }))}
        maxVisible={3}
        trigger={<Badge variant="secondary">All</Badge>}
      />
    ) : (
      <NetworkLogosPill networks={req.chainIds.map((chainId) => ({ chainId }))} />
    )

  const columns: DataTableColumn<AddressBookRequestItemDto>[] = [
    {
      id: 'name',
      header: 'Name',
      width: '15%',
      sticky: true,
      minWidth: 120,
      emphasis: 'strong',
      // Compact drops the address column, so the address rides under the name and a long name
      // wraps into the width that frees up instead of truncating.
      cell: (req, { isCompact }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="inline-flex min-w-0 items-center gap-2 overflow-hidden">
            <span className={cn('min-w-0', !isCompact && 'truncate')}>{req.name}</span>
            {spaceAddresses.has(req.address.toLowerCase()) && (
              <Tooltip>
                <TooltipTrigger render={<Badge variant="outline">Already in Workspace</Badge>} />
                <TooltipContent>Approving replaces the existing Workspace entry for this address.</TooltipContent>
              </Tooltip>
            )}
          </span>
          {isCompact && renderAddressCell(req.address, true)}
        </div>
      ),
    },
    {
      id: 'address',
      header: 'Address',
      width: '30%',
      minWidth: 240,
      priority: 'secondary',
      cell: (req) => renderAddressCell(req.address),
    },
    {
      id: 'chains',
      header: 'Chains',
      width: '20%',
      priority: 'secondary',
      minWidth: 90,
      cell: renderChains,
    },
    {
      id: 'requestedBy',
      header: 'Requested by',
      width: '20%',
      priority: 'secondary',
      minWidth: 140,
      cell: (req) =>
        req.requestedBy ? (
          <RequestedBy
            requestedBy={req.requestedBy}
            isWalletAddress={isWalletAddress}
            renderRequesterHashInfo={renderRequesterHashInfo}
          />
        ) : null,
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
                    <Button
                      variant="outline"
                      size="icon-sm"
                      data-testid="approve-request-btn"
                      onClick={() => onApprove(req.id)}
                    >
                      <Check className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Accept</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger render={<span className="inline-flex" />}>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      data-testid="reject-request-btn"
                      onClick={() => onReject(req.id)}
                    >
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
        <div className="flex flex-wrap gap-1">{req.chainIds.map((chainId) => renderChainIndicator(chainId))}</div>
      </div>
      {req.requestedBy && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-24 shrink-0">Requested by</span>
          <RequestedBy
            requestedBy={req.requestedBy}
            isWalletAddress={isWalletAddress}
            renderRequesterHashInfo={renderRequesterHashInfo}
          />
        </div>
      )}
    </div>
  )

  if (requests.length === 0) {
    return <p className="text-muted-foreground p-4 text-sm">No pending requests.</p>
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
