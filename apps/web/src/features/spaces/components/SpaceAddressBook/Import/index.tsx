import ImportIcon from '@/public/images/common/import.svg'
import { Button, SvgIcon } from '@mui/material'
import { useState } from 'react'
import ImportAddressBookDialog from './ImportAddressBookDialog'

const ImportAddressBook = ({ disabled }: { disabled?: boolean }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<SvgIcon component={ImportIcon} inheritViewBox fontSize="small" color="primary" />}
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        Import
      </Button>
      {open && <ImportAddressBookDialog handleClose={() => setOpen(false)} />}
    </>
  )
}

export default ImportAddressBook
