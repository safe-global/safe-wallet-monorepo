import { useCSVDownloader } from 'react-papaparse'
import type { SyntheticEvent } from 'react'
import { useMemo, type ReactElement } from 'react'

import { type AddressBookState, selectAllAddressBooks } from '@/store/addressBookSlice'
import { useAppSelector } from '@/store'
import { trackEvent, ADDRESS_BOOK_EVENTS } from '@/services/analytics'
import madProps from '@/utils/mad-props'
import { ExportDialogView } from '@views/components/address-book/ExportDialog/ExportDialogView'

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
    <ExportDialogView
      length={length}
      onClose={handleClose}
      onExport={onSubmit}
      renderDownloader={(props) => (
        <CSVDownloader filename={filename} bom config={{ delimiter: ',' }} data={csvData} {...props} />
      )}
    />
  )
}

const useAllAddressBooks = () => useAppSelector(selectAllAddressBooks)

export default madProps(ExportDialog, {
  allAddressBooks: useAllAddressBooks,
})
