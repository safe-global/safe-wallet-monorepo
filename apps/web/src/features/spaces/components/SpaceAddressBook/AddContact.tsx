import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useGetSpaceAddressBook, useWorkspaceAddressBookLabel } from '@/features/spaces'
import { getContactAddedMessage } from '@/utils/addressBookNotifications'
import AddContactDialog from './AddContactDialog'

export type { ContactField } from './AddContactDialog'

const SUCCESS_GROUP_KEY = 'add-contact-success'

const AddContact = ({ label }: { label?: string }) => {
  const addressBookItems = useGetSpaceAddressBook()
  const workspaceAddressBookLabel = useWorkspaceAddressBookLabel()
  const [upsertAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()

  return (
    <AddContactDialog
      triggerLabel={label}
      successMessage={getContactAddedMessage(workspaceAddressBookLabel)}
      successGroupKey={SUCCESS_GROUP_KEY}
      validateCharset
      submit={(item, sid) =>
        upsertAddressBook({
          spaceId: sid,
          upsertAddressBookItemsDto: { items: [item] },
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
