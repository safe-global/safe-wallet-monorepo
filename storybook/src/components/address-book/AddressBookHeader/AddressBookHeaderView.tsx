import type { ReactElement } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'

import AddressBookSearchInput from '@/components/common/AddressBookSearchInput'
import Track from '@/components/common/Track'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Link as ShadcnLink } from '@/components/ui/link'
import { ADDRESS_BOOK_EVENTS } from '@/services/analytics/events/addressBook'
import ImportIcon from '@/public/images/common/import.svg'
import ExportIcon from '@/public/images/common/export.svg'

export type SpaceAddressBookCta = {
  spaceName?: string
  href: { pathname: string; query: { spaceId?: string } }
}

export type AddressBookHeaderViewProps = {
  spaceCta?: SpaceAddressBookCta
  canExport: boolean
  hasEntries: boolean
  searchQuery: string
  onSearchQueryChange: (searchQuery: string) => void
  onNewEntry: () => void
  onImport: () => void
  onExport: () => void
}

export function AddressBookHeaderView({
  spaceCta,
  canExport,
  hasEntries,
  searchQuery,
  onSearchQueryChange,
  onNewEntry,
  onImport,
  onExport,
}: AddressBookHeaderViewProps): ReactElement {
  return (
    <div className="mt-8 flex flex-col gap-6 px-6">
      {spaceCta && (
        <Typography className="max-w-[500px] text-sm">
          This data is stored in your local storage. Do you want to manage your <b>{spaceCta.spaceName}</b> Workspace
          address book instead? <ShadcnLink render={<Link href={spaceCta.href} passHref />}>Click here</ShadcnLink>
        </Typography>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
        <div className="flex shrink-0 flex-wrap gap-2">
          <Track {...ADDRESS_BOOK_EVENTS.CREATE_ENTRY}>
            <Button size="action" onClick={onNewEntry}>
              <Plus className="mr-1 size-4 text-green-500" />
              New entry
            </Button>
          </Track>

          <Track {...ADDRESS_BOOK_EVENTS.IMPORT_BUTTON}>
            <Button variant="outline" size="action" onClick={onImport}>
              <ImportIcon className="size-4" />
              Import
            </Button>
          </Track>

          <Track {...ADDRESS_BOOK_EVENTS.DOWNLOAD_BUTTON}>
            <Button variant="outline" size="action" onClick={onExport} disabled={!canExport}>
              <ExportIcon className="size-4" />
              Export
            </Button>
          </Track>
        </div>

        {hasEntries && (
          <AddressBookSearchInput
            value={searchQuery}
            onChange={onSearchQueryChange}
            placeholder="Search for contacts"
            inputSize="default"
          />
        )}
      </div>
    </div>
  )
}
