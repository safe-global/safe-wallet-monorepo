import { useState } from 'react'
import { FileUp } from 'lucide-react'
import {
  useAddressBooksUpsertAddressBookItemsV1Mutation,
  type SpaceAddressBookItemDto,
  type SpaceAddressBookTagDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Button } from '@safe-global/views/components/ui/button'
import ImportDialog, { type AddressBookCSVRow, type ImportOutcome } from '@/components/address-book/ImportDialog'
import { useCurrentSpaceId, useWorkspaceAddressBookLabel } from '@/features/spaces'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import useChains from '@/hooks/useChains'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getImportSuccessMessage } from '@/utils/addressBookNotifications'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { toWorkspaceImport, validateWorkspaceRows } from './csvImport'

const NOTHING_TO_IMPORT = 'Every contact in this file is already in the address book'

type ImportWorkspaceCsvProps = {
  items: SpaceAddressBookItemDto[]
  tags: SpaceAddressBookTagDto[]
  /** `lg` in the toolbar; the empty state keeps `action`. */
  size?: 'action' | 'lg'
}

/** Imports a CSV into the workspace address book: new contacts are added, saved ones only gain chains and tags. */
const ImportWorkspaceCsv = ({ items, tags, size = 'action' }: ImportWorkspaceCsvProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const { configs } = useChains()
  const spaceId = useCurrentSpaceId()
  const bookLabel = useWorkspaceAddressBookLabel()
  const dispatch = useAppDispatch()
  const [upsertAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()

  const validateRows = (rows: AddressBookCSVRow[]) => {
    const supportedChainIds = configs.map((chain) => chain.chainId)
    const rowError = validateWorkspaceRows(rows, items, tags, supportedChainIds)
    if (rowError) return rowError
    return toWorkspaceImport(rows, items, tags).items.length === 0 ? NOTHING_TO_IMPORT : undefined
  }

  const onImport = async (rows: AddressBookCSVRow[]): Promise<ImportOutcome> => {
    const { items: contacts, newCount, updatedCount, networkCount } = toWorkspaceImport(rows, items, tags)
    // Skipping look-alikes can leave nothing to send
    if (contacts.length === 0) return { done: true }

    const result = await upsertAddressBook({ spaceId: spaceId ?? '', upsertAddressBookItemsDto: { items: contacts } })
    // A cancelled step-up keeps the dialog and its file, with no error
    if (isElevationRequiredError(result.error)) return { done: false }
    if (result.error) return { done: false, error: getRtkQueryErrorMessage(result.error) }

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
      [MixpanelEventParams.WITH_TAGS]: contacts.some((contact) => contact.tags?.length),
    })
    return { done: true }
  }

  return (
    <>
      {/* Tracked on click, not with <Track>: its wrapper would break a ButtonGroup's corners */}
      <Button
        variant="outline"
        size={size}
        onClick={() => {
          trackEvent(SPACE_EVENTS.IMPORT_ADDRESS_BOOK)
          setIsOpen(true)
        }}
      >
        <FileUp aria-hidden="true" data-icon="inline-start" />
        Import
      </Button>
      {isOpen && <ImportDialog handleClose={() => setIsOpen(false)} validateRows={validateRows} onImport={onImport} />}
    </>
  )
}

export default ImportWorkspaceCsv
