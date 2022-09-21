import { ReactElement } from 'react'
import { Box, Typography } from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

const InvalidTransaction = (): ReactElement => {
  return (
    <Box p={4} alignItems="center" justifyContent="center">
      <Box display="flex" alignItems="center">
        <ErrorOutlineIcon color="error" />
        <Typography variant="h4">Transaction error</Typography>
      </Box>
      <br />
      <Typography>
        This Safe App initiated a transaction which cannot be processed. Please get in touch with the developer of this
        Safe App for more information.
      </Typography>
    </Box>
  )
}

export default InvalidTransaction
