import { useContext, useMemo, useState } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import PaginatedDataTable, { type DataTableColumn } from '@/components/common/PaginatedDataTable'
import type { AddressEntry } from '@/components/address-book/EntryDialog'
import EntryDialog from '@/components/address-book/EntryDialog'
import ExportDialog from '@/components/address-book/ExportDialog'
import ImportDialog from '@/components/address-book/ImportDialog'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import SendIcon from '@/public/images/common/arrow-up-right.svg'
import RemoveDialog from '@/components/address-book/RemoveDialog'
import EthHashInfo from '@/components/common/EthHashInfo'
import AddressBookHeader from '../AddressBookHeader'
import useAddressBook from '@/hooks/useAddressBook'
import Track from '@/components/common/Track'
import { ADDRESS_BOOK_EVENTS } from '@/services/analytics/events/addressBook'
import PagePlaceholder from '@/components/common/PagePlaceholder'
import NoEntriesIcon from '@/public/images/address-book/no-entries.svg'
import { useCurrentChain } from '@/hooks/useChains'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import TableCard from '@/components/common/TableCard'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import CheckWallet from '@/components/common/CheckWallet'
import madProps from '@/utils/mad-props'

type Entry = { address: string; name: string }

export enum ModalType {
  EXPORT = 'export',
  IMPORT = 'import',
  ENTRY = 'entry',
  REMOVE = 'remove',
}

const defaultOpen = {
  [ModalType.EXPORT]: false,
  [ModalType.IMPORT]: false,
  [ModalType.ENTRY]: false,
  [ModalType.REMOVE]: false,
}

type AddressBookTableProps = {
  chain?: Chain
  setTxFlow: TxModalContextType['setTxFlow']
}

function AddressBookTable({ chain, setTxFlow }: AddressBookTableProps) {
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const [searchQuery, setSearchQuery] = useState('')
  const [defaultValues, setDefaultValues] = useState<AddressEntry | undefined>(undefined)
  const isDarkMode = useDarkMode()

  const handleOpenModal = (type: keyof typeof open) => () => {
    setOpen((prev) => ({ ...prev, [type]: true }))
  }

  const handleOpenModalWithValues = (modal: ModalType, address: string, name: string) => {
    setDefaultValues({ address, name })
    handleOpenModal(modal)()
  }

  const handleClose = () => {
    setOpen(defaultOpen)
    setDefaultValues(undefined)
  }

  const addressBook = useAddressBook()
  const addressBookEntries = useMemo(() => Object.entries(addressBook), [addressBook])
  const filteredEntries = useMemo(() => {
    if (!searchQuery) {
      return addressBookEntries
    }

    const query = searchQuery.toLowerCase()
    return addressBookEntries.filter(([address, name]) => {
      return address.toLowerCase().includes(query) || name.toLowerCase().includes(query)
    })
  }, [addressBookEntries, searchQuery])

  const renderActionButtons = (address: string, name: string) => (
    <>
      <Track {...ADDRESS_BOOK_EVENTS.EDIT_ENTRY}>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit entry"
                onClick={() => handleOpenModalWithValues(ModalType.ENTRY, address, name)}
              >
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
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete entry"
                onClick={() => handleOpenModalWithValues(ModalType.REMOVE, address, name)}
              >
                <DeleteIcon className="size-4 text-[var(--color-error-main)]" />
              </Button>
            }
          />
          <TooltipContent>Delete entry</TooltipContent>
        </Tooltip>
      </Track>

      <CheckWallet>
        {(isOk) => (
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
                      onClick={() => setTxFlow(<TokenTransferFlow recipients={[{ recipient: address }]} />)}
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
        )}
      </CheckWallet>
    </>
  )

  const entries: Entry[] = useMemo(
    () => filteredEntries.map(([address, name]) => ({ address, name })),
    [filteredEntries],
  )

  const columns: DataTableColumn<Entry>[] = [
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
              <EthHashInfo
                address={entry.address}
                showName={false}
                shortAddress
                showAvatar={false}
                hasExplorer
                showCopyButton
              />
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
      cell: (entry) => (
        <EthHashInfo address={entry.address} showName={false} shortAddress={false} hasExplorer showCopyButton />
      ),
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
      <AddressBookHeader
        handleOpenModal={handleOpenModal}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        hasEntries={addressBookEntries.length > 0}
      />

      <main>
        {filteredEntries.length > 0 ? (
          <TableCard className="mb-4">
            <PaginatedDataTable columns={columns} rows={entries} getRowKey={(entry) => entry.address} />
          </TableCard>
        ) : (
          <TableCard>
            <PagePlaceholder
              img={<NoEntriesIcon />}
              text={`No entries found${chain ? ` on ${chain.chainName}` : ''}`}
            />
          </TableCard>
        )}
      </main>

      {open[ModalType.EXPORT] && <ExportDialog handleClose={handleClose} />}

      {open[ModalType.IMPORT] && <ImportDialog handleClose={handleClose} />}

      {open[ModalType.ENTRY] && (
        <EntryDialog
          handleClose={handleClose}
          defaultValues={defaultValues}
          disableAddressInput={Boolean(defaultValues?.name)}
        />
      )}

      {open[ModalType.REMOVE] && <RemoveDialog handleClose={handleClose} address={defaultValues?.address || ''} />}
    </div>
  )
}

const useSetTxFlow = () => useContext(TxModalContext).setTxFlow

export default madProps(AddressBookTable, {
  chain: useCurrentChain,
  setTxFlow: useSetTxFlow,
})
