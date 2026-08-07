import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { useAppDispatch } from '@/store'
import AddContactDialog from './AddContactDialog'

const AddLocalContact = () => {
  const dispatch = useAppDispatch()

  return (
    <AddContactDialog
      triggerLabel="Add contact"
      dialogTitle="Add contact"
      intro="This contact is stored locally in this browser. You can propose adding it to the shared workspace address book later."
      successMessage="Contact added"
      successGroupKey="add-local-contact-success"
      submit={(item) => {
        dispatch(upsertAddressBookEntries({ chainIds: item.chainIds, address: item.address, name: item.name }))
        return Promise.resolve({})
      }}
    />
  )
}

export default AddLocalContact
