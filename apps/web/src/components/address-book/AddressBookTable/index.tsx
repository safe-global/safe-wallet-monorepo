import { useContext, useMemo, useState } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import type { AddressEntry } from '@/components/address-book/EntryDialog'
import EntryDialog from '@/components/address-book/EntryDialog'
import ExportDialog from '@/components/address-book/ExportDialog'
import ImportDialog from '@/components/address-book/ImportDialog'
import RemoveDialog from '@/components/address-book/RemoveDialog'
import EthHashInfo from '@/components/common/EthHashInfo'
import AddressBookHeader from '../AddressBookHeader'
import useAddressBook from '@/hooks/useAddressBook'
import { useCurrentChain } from '@/hooks/useChains'
import { useDarkMode } from '@/hooks/useDarkMode'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import CheckWallet from '@/components/common/CheckWallet'
import madProps from '@/utils/mad-props'
import {
  AddressBookTableView,
  type AddressBookTableEntry,
} from '@views/components/address-book/AddressBookTable/AddressBookTableView'

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

  const entries: AddressBookTableEntry[] = useMemo(
    () => filteredEntries.map(([address, name]) => ({ address, name })),
    [filteredEntries],
  )

  return (
    <AddressBookTableView
      isDarkMode={isDarkMode}
      chainName={chain?.chainName}
      entries={entries}
      onEdit={(address, name) => handleOpenModalWithValues(ModalType.ENTRY, address, name)}
      onDelete={(address, name) => handleOpenModalWithValues(ModalType.REMOVE, address, name)}
      onSend={(address) => setTxFlow(<TokenTransferFlow recipients={[{ recipient: address }]} />)}
      renderAddress={(props) => <EthHashInfo {...props} />}
      renderCheckWallet={(render) => <CheckWallet>{render}</CheckWallet>}
      header={
        <AddressBookHeader
          handleOpenModal={handleOpenModal}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          hasEntries={addressBookEntries.length > 0}
        />
      }
      dialogs={
        <>
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
        </>
      }
    />
  )
}

const useSetTxFlow = () => useContext(TxModalContext).setTxFlow

export default madProps(AddressBookTable, {
  chain: useCurrentChain,
  setTxFlow: useSetTxFlow,
})
