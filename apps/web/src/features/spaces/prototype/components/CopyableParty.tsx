import { Check, Copy } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import Identicon from '@/components/common/Identicon'
import { useCopyToClipboard } from '@/components/common/AuditLog'
import { HINT_CLASS } from './shared'

// An address shown as an avatar and a name. Clicking it does what its row does; clicking the tooltip copies the address.
export function CopyableParty({
  name,
  address,
  avatar = address,
  mono = false,
  tone,
}: {
  name: string
  address: string
  avatar?: string
  // The name is itself a short address.
  mono?: boolean
  tone?: 'destructive'
}) {
  const [copied, copy] = useCopyToClipboard(address)
  const CopyIcon = copied ? Check : Copy
  return (
    <Tooltip delay={150}>
      <TooltipTrigger render={<span className="group/party flex min-w-0 shrink items-center gap-1.5" />}>
        {/* Grey until the row or the avatar is hovered, so colour doesn't compete with the type tag. */}
        <span className="flex shrink-0 grayscale transition-[filter] group-hover/transaction:grayscale-0 group-hover/party:grayscale-0">
          <Identicon address={avatar} size={24} />
        </span>
        <span
          className={`truncate ${mono ? 'font-mono text-xs' : ''} ${tone === 'destructive' ? 'text-destructive' : ''}`}
        >
          {name}
        </span>
      </TooltipTrigger>
      <TooltipContent className={HINT_CLASS}>
        <button
          type="button"
          className="flex cursor-copy items-start gap-2 text-left"
          onClick={(event) => {
            event.stopPropagation()
            copy()
          }}
        >
          <span className="min-w-0">
            <span className="block font-medium">{copied ? 'Copied' : mono ? 'Address' : name}</span>
            <span className="mt-1 block break-all font-mono">{address}</span>
          </span>
          <CopyIcon className="mt-0.5 size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      </TooltipContent>
    </Tooltip>
  )
}
