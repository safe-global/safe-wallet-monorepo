import type { ReactNode } from 'react'
import { Check, Inbox, X } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@safe-global/views/components/ui/empty'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import PaginatedDataTable, { type DataTableColumn } from '@safe-global/views/components/common/PaginatedDataTable'
import AddedBy from './AddedBy'
import ChainLogos from './ChainLogos'
import ContactCell from './ContactCell'
import RowDetail from './RowDetail'
import type { PendingRequest } from './types'

const AlreadyInWorkspace = () => (
  <Tooltip>
    <TooltipTrigger render={<Badge variant="outline">Already in Workspace</Badge>} />
    <TooltipContent>Approving replaces the existing Workspace entry for this address.</TooltipContent>
  </Tooltip>
)

const ReviewButton = ({
  label,
  testId,
  icon,
  onClick,
}: {
  label: string
  testId: string
  icon: ReactNode
  onClick: () => void
}) => (
  <Tooltip>
    <TooltipTrigger render={<span className="inline-flex" />}>
      <Button variant="outline" size="icon-sm" aria-label={label} data-testid={testId} onClick={onClick}>
        {icon}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
)

type PendingRequestsProps = {
  requests: PendingRequest[]
  /** Admins accept or decline; members see their own requests as pending. */
  canReview: boolean
  /** The request being accepted or declined right now. */
  reviewingId?: number | null
  onApprove?: (id: number) => void
  onReject?: (id: number) => void
  renderAvatar?: (address: string) => ReactNode
  getExplorerLink?: (address: string) => { href: string; title: string } | undefined
}

const PendingRequests = ({
  requests,
  canReview,
  reviewingId,
  onApprove,
  onReject,
  renderAvatar,
  getExplorerLink,
}: PendingRequestsProps) => {
  if (requests.length === 0) {
    return (
      <Empty data-testid="pending-requests-empty">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>No pending requests</EmptyTitle>
          <EmptyDescription>
            {canReview
              ? 'When members ask to add a contact to the Workspace, their requests show up here.'
              : 'Contacts you ask to add to the Workspace wait here until an admin reviews them.'}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const secondaryColumns: DataTableColumn<PendingRequest>[] = [
    {
      id: 'chains',
      header: 'Chains',
      width: 'share',
      priority: 'secondary',
      minWidth: 90,
      sortValue: (request) => request.chains.length,
      cell: (request) => <ChainLogos chains={request.chains} />,
    },
    {
      id: 'requested-by',
      header: 'Requested by',
      width: 'share',
      priority: 'secondary',
      minWidth: 140,
      sortValue: (request) => request.requestedBy?.toLowerCase() ?? null,
      cell: (request) => <AddedBy name={request.requestedBy} />,
    },
  ]

  const renderReview = (request: PendingRequest) => {
    if (!canReview) return <Badge variant="secondary">Pending</Badge>
    if (reviewingId === request.id) return <Spinner className="size-5" />

    return (
      <>
        <ReviewButton
          label="Accept"
          testId="approve-request-btn"
          icon={<Check className="size-4" />}
          onClick={() => onApprove?.(request.id)}
        />
        <ReviewButton
          label="Decline"
          testId="reject-request-btn"
          icon={<X className="size-4" />}
          onClick={() => onReject?.(request.id)}
        />
      </>
    )
  }

  const columns: DataTableColumn<PendingRequest>[] = [
    {
      id: 'contact',
      header: 'Contact',
      width: 'share',
      minWidth: 445,
      sortValue: (request) => request.name.toLowerCase(),
      cell: (request, { isCompact }) => (
        <ContactCell
          name={request.name}
          address={request.address}
          isCompact={isCompact}
          avatar={renderAvatar?.(request.address)}
          explorerLink={getExplorerLink?.(request.address)}
          badge={request.isInWorkspace ? <AlreadyInWorkspace /> : undefined}
        />
      ),
    },
    ...secondaryColumns,
    {
      id: 'actions',
      width: 'fit',
      align: 'end',
      minWidth: 96,
      cell: (request) => <span className="inline-flex items-center justify-end gap-1">{renderReview(request)}</span>,
    },
  ]

  return (
    <PaginatedDataTable
      columns={columns}
      rows={requests}
      getRowKey={(request) => String(request.id)}
      renderRowDetail={(request) => <RowDetail row={request} columns={secondaryColumns} />}
    />
  )
}

export default PendingRequests
