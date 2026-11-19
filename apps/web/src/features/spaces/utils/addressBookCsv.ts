import { jsonToCSV } from 'react-papaparse'
import type { SpaceAddressBookItemDto, SpaceAddressBookTagDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const COLUMNS = ['address', 'name', 'chainId']

export const CSV_TAG_SEPARATOR = ';'

/** One row per chain, in the `address,name,chainId,tags` shape the address book importer reads back. */
export const spaceAddressBookToCsvRows = (items: SpaceAddressBookItemDto[], tags: SpaceAddressBookTagDto[]) => {
  const tagNames = new Map(tags.map((tag) => [tag.id, tag.name]))
  return items.flatMap((item) => {
    const itemTags = item.tagIds.flatMap((id) => tagNames.get(id) ?? []).join(CSV_TAG_SEPARATOR)
    return item.chainIds.map((chainId) => ({ address: item.address, name: item.name, chainId, tags: itemTags }))
  })
}

/** The v1 export, without tags. */
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
