import ImportIcon from '@/public/images/common/import.svg'
import { useMemo, useState } from 'react'
import ImportAddressBookDialog from './ImportAddressBookDialog'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import { flattenAddressBook } from '../utils'

const ImportAddressBook = () => {
  const [open, setOpen] = useState(false)
  const allAddressBooks = useAllAddressBooks()
  const hasContacts = useMemo(() => flattenAddressBook(allAddressBooks).length > 0, [allAddressBooks])

  return (
    <>
      <Tooltip>
        <TooltipTrigger render={<div className="inline-flex" />}>
          <Button variant="outline" size="action" disabled={!hasContacts} onClick={() => setOpen(true)}>
            <ImportIcon className="size-4" />
            Import
          </Button>
        </TooltipTrigger>
        {!hasContacts && <TooltipContent>You don&apos;t have any contacts in your local address book</TooltipContent>}
      </Tooltip>
      {open && <ImportAddressBookDialog handleClose={() => setOpen(false)} />}
    </>
  )
}

export default ImportAddressBook
