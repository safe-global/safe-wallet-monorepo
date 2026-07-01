import { Typography } from '@/components/ui/typography'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import CopyAddressIconButton from '../CopyAddressIconButton'

/**
 * Address + inline copy button, laid out consistently for shadcn account
 * rows/cards. Shows a shortened address by default; pass `full` to render the
 * complete address. Keeps spacing and typography aligned across the surfaces
 * that show a Safe address.
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
      className={full ? 'break-all font-mono' : 'truncate'}
    >
      {full ? (
        <>
          {/* Bold the first 4 and last 6 chars (in mono) so addresses are easy to verify at a glance. */}
          <span className="text-foreground font-bold">{address.slice(0, 4)}</span>
          {address.slice(4, -6)}
          <span className="text-foreground font-bold">{address.slice(-6)}</span>
        </>
      ) : (
        shortenAddress(address)
      )}
    </Typography>
    <CopyAddressIconButton address={address} />
  </div>
)

export default AddressWithCopy
