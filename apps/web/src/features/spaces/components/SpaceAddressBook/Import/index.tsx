import ImportIcon from '@/public/images/common/import.svg'
import { SvgIcon } from '@mui/material'
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
          <Button
            variant="outline"
            size="lg"
            className="px-4 py-0"
            disabled={!hasContacts}
            onClick={() => setOpen(true)}
          >
            <SvgIcon component={ImportIcon} inheritViewBox fontSize="small" />
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
