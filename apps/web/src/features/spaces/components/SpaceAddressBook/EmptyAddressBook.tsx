import { Box, Card, Typography } from '@mui/material'
import AddressBookIcon from '@/public/images/address-book/empty-address-book.svg'

const EmptyAddressBook = () => {
  return (
    <>
      <Card sx={{ p: 5, textAlign: 'center' }}>
        <Box display="flex" justifyContent="center">
          <AddressBookIcon />
        </Box>

        <Typography color="text.secondary" mb={2}>
          Your contacts will appear here.
        </Typography>
      </Card>
    </>
  )
}

export default EmptyAddressBook
