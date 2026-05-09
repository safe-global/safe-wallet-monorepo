import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@mui/material'

const TX_DECODER_URL = 'https://transaction-decoder.pages.dev'
const SAFE_UTILS_URL = 'https://safeutils.openzeppelin.com'

const DecoderLinks = () => (
  <Typography variant="body2" color="primary.light" mb={3}>
    Cross-verify your transaction data with external tools like{' '}
    <ExternalLink href={SAFE_UTILS_URL}>Safe Utils</ExternalLink> and{' '}
    <ExternalLink href={TX_DECODER_URL}>Transaction Decoder</ExternalLink>.
  </Typography>
)

export default DecoderLinks
