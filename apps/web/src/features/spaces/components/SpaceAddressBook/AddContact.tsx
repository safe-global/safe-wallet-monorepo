import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId, useGetSpaceAddressBook } from '@/features/spaces'
import AddContactDialog from './AddContactDialog'

export type { ContactField } from './AddContactDialog'

const AddContact = ({ label = 'Add contact' }: { label?: string }) => {
  const spaceId = useCurrentSpaceId()
  const addressBookItems = useGetSpaceAddressBook()
  const [upsertAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()

  return (
    <AddContactDialog
      triggerLabel={label}
      dialogTitle="Add contact"
      successMessage="Added contact"
      successGroupKey="add-contact-success"
      submit={(item, sid) =>
        upsertAddressBook({
          spaceId: Number(sid),
          upsertAddressBookItemsDto: { items: [item] },
        })
      }
      onSubmitStart={() => trackEvent({ ...SPACE_EVENTS.ADD_ADDRESS_SUBMIT })}
      onSuccess={() =>
        trackEvent(
          { ...SPACE_EVENTS.ADDRESS_BOOK_ENTRY_CREATED },
          { workspace_id: spaceId, entry_count_after: addressBookItems.length + 1 },
        )
      }
    />
  )
}

export default AddContact
