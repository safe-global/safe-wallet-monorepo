import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useCSVDownloader } from 'react-papaparse'
import type { SyntheticEvent } from 'react'
import { useMemo, type ReactElement } from 'react'

import ModalDialog from '@/components/common/ModalDialog'
import { type AddressBookState, selectAllAddressBooks } from '@/store/addressBookSlice'
import { useAppSelector } from '@/store'
import { trackEvent, ADDRESS_BOOK_EVENTS } from '@/services/analytics'
import ExternalLink from '@/components/common/ExternalLink'
import madProps from '@/utils/mad-props'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

const COL_1 = 'address'
const COL_2 = 'name'
const COL_3 = 'chainId'

type CsvData = { [COL_1]: string; [COL_2]: string; [COL_3]: string }[]

export const _getCsvData = (addressBooks: AddressBookState): CsvData => {
  const csvData = Object.entries(addressBooks).reduce<CsvData>((acc, [chainId, entries]) => {
    Object.entries(entries).forEach(([address, name]) => {
      acc.push({
        [COL_1]: address,
        [COL_2]: name,
        [COL_3]: chainId,
      })
    })

    return acc
  }, [])

  return csvData
}

function ExportDialog({
  allAddressBooks,
  handleClose,
}: {
  allAddressBooks: AddressBookState
  handleClose: () => void
}): ReactElement {
  const length = Object.values(allAddressBooks).reduce<number>((acc, entries) => acc + Object.keys(entries).length, 0)
  const { CSVDownloader } = useCSVDownloader()
  // safe-address-book-1970-01-01
  const filename = `safe-address-book-${new Date().toISOString().slice(0, 10)}`

  const csvData = useMemo(() => _getCsvData(allAddressBooks), [allAddressBooks])

  const onSubmit = (e: SyntheticEvent) => {
    e.preventDefault()

    trackEvent(ADDRESS_BOOK_EVENTS.EXPORT)

    setTimeout(() => {
      handleClose()
    }, 300)
  }

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Export address book" hideChainIndicator>
      <DialogContent sx={{ p: '24px !important' }}>
        <Typography data-testid="export-summary">
          You&apos;re about to export a CSV file with{' '}
          <b>
            {length} address book {length === 1 ? 'entry' : 'entries'}
          </b>
          .
        </Typography>

        <Typography mt={1}>
          <ExternalLink
            href={HelpCenterArticle.ADDRESS_BOOK_DATA}
            title="Learn about the address book import and export"
          >
            Learn about the address book import and export
          </ExternalLink>
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <CSVDownloader filename={filename} bom config={{ delimiter: ',' }} data={csvData} style={{ order: 2 }}>
          <Button data-testid="export-modal-btn" variant="contained" disableElevation onClick={onSubmit}>
            Export
          </Button>
        </CSVDownloader>
      </DialogActions>
    </ModalDialog>
  )
}

const useAllAddressBooks = () => useAppSelector(selectAllAddressBooks)

export default madProps(ExportDialog, {
  allAddressBooks: useAllAddressBooks,
})
