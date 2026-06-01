import { useUserAddressBookUpsertPrivateItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import AddContactDialog from './AddContactDialog'

const AddPrivateContact = () => {
  const [upsertPrivate] = useUserAddressBookUpsertPrivateItemsV1Mutation()

  return (
    <AddContactDialog
      triggerLabel="Add private contact"
      dialogTitle="Add private contact"
      intro="This contact will be visible only to you. You can request to add it to the shared workspace address book later."
      successMessage="Private contact added"
      successGroupKey="add-private-contact-success"
      submit={(item, sid) =>
        upsertPrivate({
          spaceId: Number(sid),
          upsertAddressBookItemsDto: { items: [item] },
        })
      }
    />
  )
}

export default AddPrivateContact
