import { Card, Typography } from '@mui/material'
import AddressBookIcon from '@/public/images/address-book/empty-address-book.svg'

const EmptyAddressBook = () => {
  return (
    <>
      <Card sx={{ p: 5, textAlign: 'center' }}>
        <AddressBookIcon />

        <Typography color="text.secondary" mb={2}>
          Your contacts will appear here.
        </Typography>
      </Card>
    </>
  )
}

export default EmptyAddressBook
