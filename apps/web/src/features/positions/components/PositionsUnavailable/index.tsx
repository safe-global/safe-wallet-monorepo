import { Paper, Typography } from '@mui/material'
import DefiIcon from '@/public/images/balances/defi.svg'

// This component is displayed when the positions feature flag IS enabled,
// but the API does not return data from CGW (Client Gateway).
const PositionsUnavailable = () => {
  return (
    <Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
      <DefiIcon />

      <Typography data-testid="positions-unavailable-text" variant="body1" color="primary.light">
        Positions are not available on this network
      </Typography>

      <Typography variant="caption" color="primary.light" sx={{ mt: 1, display: 'block' }}>
        Positions feature is still in beta and will be available soon
      </Typography>
    </Paper>
  )
}

export default PositionsUnavailable
