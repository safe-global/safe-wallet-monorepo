import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { WorkspaceTag } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import { useGetSpaceAddressBook, useWorkspaceAddressBookLabel } from '@/features/spaces'
import { getContactAddedMessage } from '@/utils/addressBookNotifications'
import AddContactDialog from './AddContactDialog'

export type { ContactField } from './AddContactDialog'

type AddContactProps = {
  label?: string
  /** Shows the Tags field; the v2 address book passes them. */
  workspaceTags?: WorkspaceTag[]
  onTagLimitReached?: () => void
}

const AddContact = ({ label = 'Add contact', workspaceTags, onTagLimitReached }: AddContactProps) => {
  const addressBookItems = useGetSpaceAddressBook()
  const workspaceAddressBookLabel = useWorkspaceAddressBookLabel()
  const [upsertAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()

  return (
    <AddContactDialog
      triggerLabel={label}
      dialogTitle="Add contact"
      successMessage={getContactAddedMessage(workspaceAddressBookLabel)}
      successGroupKey="add-contact-success"
      validateCharset
      workspaceTags={workspaceTags}
      onTagLimitReached={onTagLimitReached}
      submit={({ tagColors, ...item }, sid) =>
        upsertAddressBook({
          spaceId: sid,
          upsertAddressBookItemsDto: { items: [item], ...(tagColors?.length ? { tagColors } : {}) },
        })
      }
      onSubmitStart={() => trackEvent({ ...SPACE_EVENTS.ADD_ADDRESS_SUBMIT })}
      onSuccess={() =>
        trackEvent(SPACE_EVENTS.ADDRESS_BOOK_ENTRY_CREATED, {
          [MixpanelEventParams.ENTRY_COUNT]: addressBookItems.length + 1,
        })
      }
    />
  )
}

export default AddContact
