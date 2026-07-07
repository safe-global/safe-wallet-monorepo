import { ExternalLink } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import CopyAddressIconButton from '../CopyAddressIconButton'

/**
 * Address + inline copy button, laid out consistently for shadcn account
 * rows/cards. Keeps spacing, truncation, and typography aligned across the
 * surfaces that show a Safe address. Pass `full` to render the complete
 * address (e.g. in a table) instead of the shortened form, and `explorerLink`
 * to add a block-explorer link next to the copy affordance.
 */
const AddressWithCopy = ({
  address,
  full = false,
  showCopy = true,
  explorerLink,
  'data-testid': testId,
}: {
  address: string
  full?: boolean
  /** Renders the inline copy affordance (with its hover tooltip). Off where the full address is already shown. */
  showCopy?: boolean
  /** Adds a block-explorer link next to the copy affordance (as shown in account rows elsewhere). */
  explorerLink?: { href: string; title: string }
  'data-testid'?: string
}) => (
  <div className="flex min-w-0 items-center gap-1.5">
    <Typography
      data-testid={testId}
      variant="paragraph-mini"
      color="muted"
      className={full ? 'whitespace-nowrap font-mono' : 'truncate'}
    >
      {full ? address : shortenAddress(address)}
    </Typography>
    {(showCopy || explorerLink) && (
      // Stop clicks from bubbling so these affordances stay usable inside a clickable/selectable row.
      <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {showCopy && <CopyAddressIconButton address={address} />}
        {explorerLink && (
          <Tooltip>
            <TooltipTrigger
              render={
                <a
                  href={explorerLink.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={explorerLink.title}
                  data-testid="address-explorer-link"
                  className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex shrink-0 cursor-pointer rounded p-0.5 transition-colors"
                />
              }
            >
              <ExternalLink className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>{explorerLink.title}</TooltipContent>
          </Tooltip>
        )}
      </span>
    )}
  </div>
)

export default AddressWithCopy
