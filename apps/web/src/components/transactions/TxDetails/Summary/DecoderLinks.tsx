import ExternalLink from '@/components/common/ExternalLink'
import { Paper, Typography } from '@mui/material'

const TX_DECODER_URL = 'https://transaction-decoder.vercel.app'
const SAFE_UTILS_URL = 'https://safeutils.openzeppelin.com/'

const DecoderLinsk = () => (
  <Paper sx={{ backgroundColor: 'var(--color-background-main) !important', p: 2, my: 3 }}>
    <Typography variant="body2" color="primary.light">
      Cross-verify your transaction data with external tools like{' '}
      <ExternalLink href={SAFE_UTILS_URL}>Safe Utils</ExternalLink> and{' '}
      <ExternalLink href={TX_DECODER_URL}>Decoder Tool</ExternalLink>.
    </Typography>
  </Paper>
)

export default DecoderLinsk
