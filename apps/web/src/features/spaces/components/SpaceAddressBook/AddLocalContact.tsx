import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { useAppDispatch } from '@/store'
import AddContactDialog, { type TriggerSize } from './AddContactDialog'

const AddLocalContact = ({ size }: { size?: TriggerSize }) => {
  const dispatch = useAppDispatch()

  return (
    <AddContactDialog
      triggerLabel="Add contact"
      triggerSize={size}
      dialogTitle="Add contact"
      intro="This contact is stored locally in this browser. You can propose adding it to the shared Workspace address book later."
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
