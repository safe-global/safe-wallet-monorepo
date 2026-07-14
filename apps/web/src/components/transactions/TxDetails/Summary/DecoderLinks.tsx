import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'

const TX_DECODER_URL = 'https://transaction-decoder.pages.dev'
const SAFE_UTILS_URL = 'https://safeutils.openzeppelin.com'

const DecoderLinks = () => (
  <Typography variant="paragraph-small" className="block mb-6 text-[var(--color-primary-light)]">
    Cross-verify your transaction data with external tools like{' '}
    <ExternalLink href={SAFE_UTILS_URL}>Safe Utils</ExternalLink> and{' '}
    <ExternalLink href={TX_DECODER_URL}>Transaction Decoder</ExternalLink>.
  </Typography>
)

export default DecoderLinks
