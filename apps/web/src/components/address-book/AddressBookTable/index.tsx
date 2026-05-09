import { useContext, useMemo, useState } from 'react'
import { Box, Card, Typography, useMediaQuery, useTheme } from '@mui/material'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import EnhancedTable from '@/components/common/EnhancedTable'
import type { AddressEntry } from '@/components/address-book/EntryDialog'
import EntryDialog from '@/components/address-book/EntryDialog'
import ExportDialog from '@/components/address-book/ExportDialog'
import ImportDialog from '@/components/address-book/ImportDialog'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import SendIcon from '@/public/images/common/arrow-up-right.svg'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import RemoveDialog from '@/components/address-book/RemoveDialog'
import EthHashInfo from '@/components/common/EthHashInfo'
import AddressBookHeader from '../AddressBookHeader'
import useAddressBook from '@/hooks/useAddressBook'
import Track from '@/components/common/Track'
import { ADDRESS_BOOK_EVENTS } from '@/services/analytics/events/addressBook'
import SvgIcon from '@mui/material/SvgIcon'
import PagePlaceholder from '@/components/common/PagePlaceholder'
import NoEntriesIcon from '@/public/images/address-book/no-entries.svg'
import { useCurrentChain } from '@/hooks/useChains'
import css from './styles.module.css'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import CheckWallet from '@/components/common/CheckWallet'
import madProps from '@/utils/mad-props'

const headCells = [
  { id: 'name', label: 'Name' },
  { id: 'address', label: 'Address' },
  { id: 'actions', label: 'Actions', align: 'right', disableSort: true },
]

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
  const addressBookEntries = Object.entries(addressBook)
  const filteredEntries = useMemo(() => {
    if (!searchQuery) {
      return addressBookEntries
    }

    const query = searchQuery.toLowerCase()
    return addressBookEntries.filter(([address, name]) => {
      return address.toLowerCase().includes(query) || name.toLowerCase().includes(query)
    })
  }, [addressBookEntries, searchQuery])

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const renderActionButtons = (address: string, name: string) => (
    <>
      <Track {...ADDRESS_BOOK_EVENTS.EDIT_ENTRY}>
        <Tooltip title="Edit entry" placement="top">
          <IconButton
            onClick={() => handleOpenModalWithValues(ModalType.ENTRY, address, name)}
            className={css.iconButton}
          >
            <SvgIcon component={EditIcon} inheritViewBox fontSize="small" />
          </IconButton>
        </Tooltip>
      </Track>

      <Track {...ADDRESS_BOOK_EVENTS.DELETE_ENTRY}>
        <Tooltip title="Delete entry" placement="top">
          <IconButton
            onClick={() => handleOpenModalWithValues(ModalType.REMOVE, address, name)}
            className={css.iconButton}
          >
            <SvgIcon component={DeleteIcon} inheritViewBox fontSize="small" />
          </IconButton>
        </Tooltip>
      </Track>

      <CheckWallet>
        {(isOk) => (
          <Track {...ADDRESS_BOOK_EVENTS.SEND}>
            <Tooltip title="Send" placement="top">
              <span>
                <IconButton
                  data-testid="send-btn"
                  onClick={() => setTxFlow(<TokenTransferFlow recipients={[{ recipient: address }]} />)}
                  disabled={!isOk}
                  className={css.iconButton}
                >
                  <SvgIcon component={SendIcon} inheritViewBox fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Track>
        )}
      </CheckWallet>
    </>
  )

  const rows = filteredEntries.map(([address, name]) => ({
    cells: {
      name: {
        rawValue: name,
        content: name,
      },
      address: {
        rawValue: address,
        content: <EthHashInfo address={address} showName={false} shortAddress={false} hasExplorer showCopyButton />,
      },
      actions: {
        rawValue: '',
        sticky: true,
        content: <div className={tableCss.actions}>{renderActionButtons(address, name)}</div>,
      },
    },
  }))

  return (
    <>
      <AddressBookHeader
        handleOpenModal={handleOpenModal}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      <main>
        {filteredEntries.length > 0 ? (
          isMobile ? (
            <Card sx={{ mb: 2, border: '4px solid transparent' }}>
              <Box className={css.mobileContainer}>
                <Box className={css.mobileHeader}>
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Actions
                  </Typography>
                </Box>
                {filteredEntries.map(([address, name]) => (
                  <Box key={address} className={css.mobileRow}>
                    <Box className={css.mobileEntryInfo}>
                      <EthHashInfo address={address} showName={true} shortAddress hasExplorer showCopyButton />
                    </Box>
                    <Box className={css.mobileActions}>{renderActionButtons(address, name)}</Box>
                  </Box>
                ))}
              </Box>
            </Card>
          ) : (
            <Card sx={{ mb: 2, border: '4px solid transparent' }}>
              <div className={css.container}>
                <EnhancedTable rows={rows} headCells={headCells} />
              </div>
            </Card>
          )
        ) : (
          <Box bgcolor="background.paper" borderRadius={1}>
            <PagePlaceholder
              img={<NoEntriesIcon />}
              text={`No entries found${chain ? ` on ${chain.chainName}` : ''}`}
            />
          </Box>
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
    </>
  )
}

const useSetTxFlow = () => useContext(TxModalContext).setTxFlow

export default madProps(AddressBookTable, {
  chain: useCurrentChain,
  setTxFlow: useSetTxFlow,
})
