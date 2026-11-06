import { useState } from 'react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import {
  useAddressBooksUpsertAddressBookItemsV1Mutation,
  type SpaceAddressBookItemDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Button } from '@safe-global/views/components/ui/button'
import ImportDialog, { type AddressBookCSVRow } from '@/components/address-book/ImportDialog'
import Track from '@/components/common/Track'
import { useCurrentSpaceId, useWorkspaceAddressBookLabel } from '@/features/spaces'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import useChains from '@/hooks/useChains'
import ImportIcon from '@/public/images/common/import.svg'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getImportSuccessMessage } from '@/utils/addressBookNotifications'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { toWorkspaceImport, validateWorkspaceRows } from './csvImport'

const NOTHING_TO_IMPORT = 'Every contact in this file is already in the address book'

/** Imports a CSV into the workspace address book: new contacts are added, saved ones only gain chains. */
const ImportWorkspaceCsv = ({ items }: { items: SpaceAddressBookItemDto[] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { configs } = useChains()
  const spaceId = useCurrentSpaceId()
  const bookLabel = useWorkspaceAddressBookLabel()
  const dispatch = useAppDispatch()
  const [upsertAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()

  const validateRows = (rows: AddressBookCSVRow[]) => {
    const supportedChainIds = configs.map((chain) => chain.chainId)
    const rowError = validateWorkspaceRows(rows, items, supportedChainIds)
    if (rowError) return rowError
    return toWorkspaceImport(rows, items).items.length === 0 ? NOTHING_TO_IMPORT : undefined
  }

  const onImport = async (rows: AddressBookCSVRow[]) => {
    const { items: contacts, newCount, updatedCount } = toWorkspaceImport(rows, items)
    // Skipping look-alikes can leave nothing to send
    if (contacts.length === 0) return

    const result = await upsertAddressBook({ spaceId: spaceId ?? '', upsertAddressBookItemsDto: { items: contacts } })
    if (isElevationRequiredError(result.error)) return
    if (result.error) return getRtkQueryErrorMessage(result.error as FetchBaseQueryError | SerializedError)

    const networkCount = new Set(contacts.flatMap((contact) => contact.chainIds)).size
    dispatch(
      showNotification({
        message: getImportSuccessMessage({ count: contacts.length, networkCount, bookLabel, showsEveryNetwork: true }),
        variant: 'success',
        groupKey: 'import-contacts-success',
      }),
    )
    trackEvent(SPACE_EVENTS.IMPORT_ADDRESS_BOOK_SUBMIT, {
      [MixpanelEventParams.ENTRY_COUNT]: newCount,
      [MixpanelEventParams.UPDATED_COUNT]: updatedCount,
    })
  }

  return (
    <>
      <Track {...SPACE_EVENTS.IMPORT_ADDRESS_BOOK}>
        <Button variant="outline" size="action" onClick={() => setIsOpen(true)}>
          <ImportIcon className="size-4" />
          Import
        </Button>
      </Track>
      {isOpen && <ImportDialog handleClose={() => setIsOpen(false)} validateRows={validateRows} onImport={onImport} />}
    </>
  )
}

export default ImportWorkspaceCsv
