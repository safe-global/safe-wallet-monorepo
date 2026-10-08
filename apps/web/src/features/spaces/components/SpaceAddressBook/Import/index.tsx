import { useMemo, useState } from 'react'
import ImportAddressBookDialog from './ImportAddressBookDialog'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import { flattenAddressBook } from '../utils'
import { ImportAddressBookView } from '@views/features/spaces/components/SpaceAddressBook/Import/ImportAddressBookView'

const ImportAddressBook = () => {
  const [open, setOpen] = useState(false)
  const allAddressBooks = useAllAddressBooks()
  const hasContacts = useMemo(() => flattenAddressBook(allAddressBooks).length > 0, [allAddressBooks])

  return (
    <>
      <ImportAddressBookView hasContacts={hasContacts} onOpen={() => setOpen(true)} />
      {open && <ImportAddressBookDialog handleClose={() => setOpen(false)} />}
    </>
  )
}

export default ImportAddressBook
