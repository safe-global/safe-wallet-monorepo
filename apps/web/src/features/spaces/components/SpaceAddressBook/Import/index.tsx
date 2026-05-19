import ImportIcon from '@/public/images/common/import.svg'
import { SvgIcon } from '@mui/material'
import { useState } from 'react'
import ImportAddressBookDialog from './ImportAddressBookDialog'
import { Button } from '@/components/ui/button'

const ImportAddressBook = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="lg" className="font-bold px-4 py-0" onClick={() => setOpen(true)}>
        <SvgIcon component={ImportIcon} inheritViewBox fontSize="small" />
        Import
      </Button>
      {open && <ImportAddressBookDialog handleClose={() => setOpen(false)} />}
    </>
  )
}

export default ImportAddressBook
