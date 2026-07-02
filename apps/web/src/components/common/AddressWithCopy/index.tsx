import { Typography } from '@/components/ui/typography'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import CopyAddressIconButton from '../CopyAddressIconButton'

/**
 * Address + inline copy button, laid out consistently for shadcn account
 * rows/cards. Keeps spacing, truncation, and typography aligned across the
 * surfaces that show a Safe address. Pass `full` to render the complete
 * address (e.g. in a table) instead of the shortened form.
 */
const AddressWithCopy = ({
  address,
  full = false,
  'data-testid': testId,
}: {
  address: string
  full?: boolean
  'data-testid'?: string
}) => (
  <div className="flex min-w-0 items-center gap-1.5">
    <Typography
      data-testid={testId}
      variant="paragraph-mini"
      color="muted"
      className={full ? 'whitespace-nowrap' : 'truncate'}
    >
      {full ? address : shortenAddress(address)}
    </Typography>
    <CopyAddressIconButton address={address} />
  </div>
)

export default AddressWithCopy
