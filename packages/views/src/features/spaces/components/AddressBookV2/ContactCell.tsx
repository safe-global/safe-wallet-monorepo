import { useEffect, useState, type ReactNode } from 'react'
import { Check, Copy, HardDrive } from 'lucide-react'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import ExplorerButton from '@safe-global/views/components/common/ExplorerButton'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { cn } from '@safe-global/views/utils/cn'
import GroupedAddress from './GroupedAddress'

const COPIED_MS = 1500

/** A neutral stand-in for the identicon, derived from the address so rows stay distinguishable. */
export const AddressAvatar = ({ address, size = 24 }: { address: string; size?: number }) => {
  const hue = parseInt(address.slice(2, 6), 16) % 360
  return (
    <span
      aria-hidden="true"
      className="shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue} 70% 60%), hsl(${(hue + 60) % 360} 70% 45%))`,
      }}
    />
  )
}

const CopyAddress = ({ address }: { address: string }) => {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), COPIED_MS)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost-muted"
            size="icon-xs"
            aria-label="Copy address"
            onClick={(event) => {
              event.stopPropagation()
              navigator.clipboard?.writeText(address).then(
                () => setCopied(true),
                () => setCopied(false),
              )
            }}
          />
        }
      >
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied' : 'Copy address'}</TooltipContent>
    </Tooltip>
  )
}

type ContactCellProps = {
  name: string
  address: string
  isLocal?: boolean
  /** In the compact table the name wraps instead of truncating. */
  isCompact?: boolean
  /** The identicon. Defaults to a neutral gradient avatar. */
  avatar?: ReactNode
  explorerLink?: { href: string; title: string }
}

/** Name and full address in one cell, so the address is always visible in full. */
const ContactCell = ({ name, address, isLocal = false, isCompact = false, avatar, explorerLink }: ContactCellProps) => {
  const checksummed = checksumAddress(address)

  return (
    <div className="flex min-w-0 items-start gap-2">
      <span className="mt-0.5 shrink-0">{avatar ?? <AddressAvatar address={checksummed} />}</span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-1.5 overflow-hidden font-bold">
          {isLocal && <HardDrive className="text-muted-foreground size-4 shrink-0" aria-label="Local contact" />}
          <Tooltip>
            <TooltipTrigger className={cn('min-w-0 text-left', !isCompact && 'truncate')}>{name}</TooltipTrigger>
            <TooltipContent>{name}</TooltipContent>
          </Tooltip>
        </div>
        <div className={cn('flex items-center gap-1', isCompact && 'flex-wrap')}>
          {/* Compact: the groups and buttons wrap in one row, so the pinned column never forces a scroll */}
          <GroupedAddress address={checksummed} className={isCompact ? 'contents' : undefined} />
          <CopyAddress address={checksummed} />
          {explorerLink && <ExplorerButton {...explorerLink} className="text-muted-foreground hover:text-foreground" />}
        </div>
      </div>
    </div>
  )
}

export default ContactCell
