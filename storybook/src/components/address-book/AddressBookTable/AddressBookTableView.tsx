import type { ReactElement, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import PaginatedDataTable, { type DataTableColumn } from '@/components/common/PaginatedDataTable'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import SendIcon from '@/public/images/common/arrow-up-right.svg'
import Track from '@/components/common/Track'
import { ADDRESS_BOOK_EVENTS } from '@/services/analytics/events/addressBook'
import PagePlaceholder from '@/components/common/PagePlaceholder'
import NoEntriesIcon from '@/public/images/address-book/no-entries.svg'
import { cn } from '@/utils/cn'
import TableCard from '@/components/common/TableCard'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'

export type AddressBookTableEntry = { address: string; name: string }

export type AddressSlotProps = {
  address: string
  showName: boolean
  shortAddress: boolean
  showAvatar?: boolean
  hasExplorer: boolean
  showCopyButton: boolean
}

export type AddressBookTableViewProps = {
  isDarkMode: boolean
  chainName?: string
  entries: AddressBookTableEntry[]
  header: ReactNode
  dialogs: ReactNode
  onEdit: (address: string, name: string) => void
  onDelete: (address: string, name: string) => void
  onSend: (address: string) => void
  renderAddress: (props: AddressSlotProps) => ReactNode
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
}

export function AddressBookTableView({
  isDarkMode,
  chainName,
  entries,
  header,
  dialogs,
  onEdit,
  onDelete,
  onSend,
  renderAddress,
  renderCheckWallet,
}: AddressBookTableViewProps): ReactElement {
  const renderActionButtons = (address: string, name: string) => (
    <>
      <Track {...ADDRESS_BOOK_EVENTS.EDIT_ENTRY}>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Edit entry" onClick={() => onEdit(address, name)}>
                <EditIcon className="size-4 text-[var(--color-border-main)]" />
              </Button>
            }
          />
          <TooltipContent>Edit entry</TooltipContent>
        </Tooltip>
      </Track>

      <Track {...ADDRESS_BOOK_EVENTS.DELETE_ENTRY}>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Delete entry" onClick={() => onDelete(address, name)}>
                <DeleteIcon className="size-4 text-[var(--color-error-main)]" />
              </Button>
            }
          />
          <TooltipContent>Delete entry</TooltipContent>
        </Tooltip>
      </Track>

      {renderCheckWallet((isOk) => (
        <Track {...ADDRESS_BOOK_EVENTS.SEND}>
          <Tooltip>
            <TooltipTrigger
              render={
                <span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Send"
                    data-testid="send-btn"
                    onClick={() => onSend(address)}
                    disabled={!isOk}
                  >
                    <SendIcon className="size-4 text-[var(--color-border-main)]" />
                  </Button>
                </span>
              }
            />
            <TooltipContent>Send</TooltipContent>
          </Tooltip>
        </Track>
      ))}
    </>
  )

  const columns: DataTableColumn<AddressBookTableEntry>[] = [
    {
      id: 'name',
      header: 'Name',
      cellTestId: 'table-cell-name',
      width: '30%',
      minWidth: 120,
      sticky: true,
      emphasis: 'strong',
      sortValue: (entry) => entry.name,
      cell: (entry, { isCompact }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={cn(!isCompact && 'truncate')}>{entry.name}</span>
          {/* Compact drops the address column, so the address rides under the name instead. */}
          {isCompact && (
            <span className="text-muted-foreground text-xs font-normal">
              {renderAddress({
                address: entry.address,
                showName: false,
                shortAddress: true,
                showAvatar: false,
                hasExplorer: true,
                showCopyButton: true,
              })}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'address',
      header: 'Address',
      cellTestId: 'table-cell-address',
      width: '40%',
      minWidth: 240,
      priority: 'secondary',
      sortValue: (entry) => entry.address,
      cell: (entry) =>
        renderAddress({
          address: entry.address,
          showName: false,
          shortAddress: false,
          hasExplorer: true,
          showCopyButton: true,
        }),
    },
    {
      id: 'actions',
      header: 'Actions',
      cellTestId: 'table-cell-actions',
      align: 'end',
      width: '30%',
      minWidth: 120,
      cell: (entry) => <div className={tableCss.actions}>{renderActionButtons(entry.address, entry.name)}</div>,
    },
  ]

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      {header}

      <main>
        {entries.length > 0 ? (
          <TableCard className="mb-4">
            <PaginatedDataTable columns={columns} rows={entries} getRowKey={(entry) => entry.address} />
          </TableCard>
        ) : (
          <TableCard>
            <PagePlaceholder img={<NoEntriesIcon />} text={`No entries found${chainName ? ` on ${chainName}` : ''}`} />
          </TableCard>
        )}
      </main>

      {dialogs}
    </div>
  )
}
