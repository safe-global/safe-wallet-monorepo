import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { useAppDispatch } from '@/store'
import AddContactDialog from './AddContactDialog'
import { LOCAL_CONTACT_COPY } from '@views/features/spaces/components/SpaceAddressBook/AddContactDialogView'

const SUCCESS_GROUP_KEY = 'add-local-contact-success'

const AddLocalContact = () => {
  const dispatch = useAppDispatch()

  return (
    <AddContactDialog
      intro={LOCAL_CONTACT_COPY.intro}
      successMessage={LOCAL_CONTACT_COPY.successMessage}
      successGroupKey={SUCCESS_GROUP_KEY}
      submit={(item) => {
        dispatch(upsertAddressBookEntries({ chainIds: item.chainIds, address: item.address, name: item.name }))
        return Promise.resolve({})
      }}
    />
  )
}

export default AddLocalContact
