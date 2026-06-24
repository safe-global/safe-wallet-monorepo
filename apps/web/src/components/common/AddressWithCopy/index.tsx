import { Typography } from '@/components/ui/typography'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import CopyAddressIconButton from '../CopyAddressIconButton'

/**
 * Shortened address + inline copy button, laid out consistently for shadcn
 * account rows/cards. Keeps spacing, truncation, and typography aligned across
 * the surfaces that show a Safe address.
 */
const AddressWithCopy = ({ address, 'data-testid': testId }: { address: string; 'data-testid'?: string }) => (
  <div className="flex min-w-0 items-center gap-1.5">
    <Typography data-testid={testId} variant="paragraph-mini" color="muted" className="truncate">
      {shortenAddress(address)}
    </Typography>
    <CopyAddressIconButton address={address} />
  </div>
)

export default AddressWithCopy
