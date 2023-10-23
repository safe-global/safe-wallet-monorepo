import { Alert } from '@mui/material'

const PairingDeprecationWarning = (): React.ReactElement => {
  return (
    <Alert severity="warning" sx={{ mb: 4 }}>
      The {'BNB Safe{Wallet}'} web-mobile pairing feature will be discontinued from 15th November 2023. Please migrate
      to a different signer wallet before this date.
    </Alert>
  )
}

export default PairingDeprecationWarning
