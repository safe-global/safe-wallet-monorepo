import { Paper, Typography } from '@mui/material'
import DefiIcon from '@/public/images/balances/defi.svg'

// This component is displayed when the positions feature flag is enabled,
// but the API does not return data from CGW (Client Gateway), or errors out.
const PositionsUnavailable = ({ hasError = false }: { hasError?: boolean }) => {
  const title = hasError ? "Couldn't load your positions" : 'Positions are not available on this network'

  const subtitle = hasError ? 'Try again later' : 'Positions feature is still in beta and will be available soon'

  return (
    <Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
      <DefiIcon />

      <Typography data-testid="positions-unavailable-text" variant="body1" color="primary.light">
        {title}
      </Typography>

      <Typography variant="caption" color="primary.light" sx={{ mt: 1, display: 'block' }}>
        {subtitle}
      </Typography>
    </Paper>
  )
}

export default PositionsUnavailable
