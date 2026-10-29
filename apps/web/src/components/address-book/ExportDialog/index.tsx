import { Typography } from '@safe-global/views/components/ui/typography'
import { Button } from '@safe-global/views/components/ui/button'
import { useCSVDownloader } from 'react-papaparse'
import type { SyntheticEvent } from 'react'
import { useMemo, type ReactElement } from 'react'

import ModalDialog from '@/components/common/ModalDialog'
import { type AddressBookState, selectAllAddressBooks } from '@/store/addressBookSlice'
import { useAppSelector } from '@/store'
import { trackEvent, ADDRESS_BOOK_EVENTS } from '@/services/analytics'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
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

type CsvExportDialogProps = {
  /** One object per CSV row; its keys are the columns. */
  csvData: Record<string, string>[]
  /** Without the `.csv` extension. */
  filename: string
  onExport?: () => void
  handleClose: () => void
}

export function CsvExportDialog({ csvData, filename, onExport, handleClose }: CsvExportDialogProps): ReactElement {
  const length = csvData.length
  const { CSVDownloader } = useCSVDownloader()

  const onSubmit = (e: SyntheticEvent) => {
    e.preventDefault()

    onExport?.()

    setTimeout(() => {
      handleClose()
    }, 300)
  }

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Export address book" hideChainIndicator>
      <div className="p-6">
        <Typography data-testid="export-summary">
          You&apos;re about to export a CSV file with{' '}
          <b>
            {length} address book {length === 1 ? 'entry' : 'entries'}
          </b>
          .
        </Typography>

        <Typography className="mt-2">
          <ExternalLink
            href={HelpCenterArticle.ADDRESS_BOOK_DATA}
            title="Learn about the address book import and export"
          >
            Learn about the address book import and export
          </ExternalLink>
        </Typography>
      </div>

      <div className="flex items-center justify-between gap-2 p-6 pt-2">
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <CSVDownloader filename={filename} bom config={{ delimiter: ',' }} data={csvData} style={{ order: 2 }}>
          <Button data-testid="export-modal-btn" onClick={onSubmit}>
            Export
          </Button>
        </CSVDownloader>
      </div>
    </ModalDialog>
  )
}

function ExportDialog({
  allAddressBooks,
  handleClose,
}: {
  allAddressBooks: AddressBookState
  handleClose: () => void
}): ReactElement {
  const csvData = useMemo(() => _getCsvData(allAddressBooks), [allAddressBooks])
  // safe-address-book-1970-01-01
  const filename = `safe-address-book-${new Date().toISOString().slice(0, 10)}`

  return (
    <CsvExportDialog
      csvData={csvData}
      filename={filename}
      onExport={() => trackEvent(ADDRESS_BOOK_EVENTS.EXPORT)}
      handleClose={handleClose}
    />
  )
}

const useAllAddressBooks = () => useAppSelector(selectAllAddressBooks)

export default madProps(ExportDialog, {
  allAddressBooks: useAllAddressBooks,
})
