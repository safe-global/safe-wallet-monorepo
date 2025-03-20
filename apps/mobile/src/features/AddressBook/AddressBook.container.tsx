import React from 'react'

import { useAppSelector } from '@/src/store/hooks'
import { AddressBookView } from '@/src/features/AddressBook/components/AddressBookView'
import { selectAllContacts } from '@/src/store/addressBookSlice'

export const AddressBookContainer = () => {
  const allContacts = useAppSelector(selectAllContacts)

  return <AddressBookView contacts={allContacts} />
}
