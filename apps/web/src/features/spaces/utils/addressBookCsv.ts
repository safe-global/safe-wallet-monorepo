import { jsonToCSV } from 'react-papaparse'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const COLUMNS = ['address', 'name', 'chainId']

/** One row per chain, in the `address,name,chainId` shape the address book importer reads back. */
export const spaceAddressBookToCsv = (items: SpaceAddressBookItemDto[]): string => {
  const rows = items.flatMap((item) =>
    item.chainIds.map((chainId) => ({ address: item.address, name: item.name, chainId })),
  )
  // papaparse writes nothing for an empty list; the importer still wants the header.
  return rows.length === 0 ? COLUMNS.join(',') : jsonToCSV(rows, { columns: COLUMNS })
}

export const downloadCsv = (fileName: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  Object.assign(link, { download: fileName, href: window.URL.createObjectURL(blob) })
  link.click()
  window.URL.revokeObjectURL(link.href)
}
