import { Check, Copy, FileCode2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import Identicon from '@safe-global/views/components/common/Identicon'
import { Tag } from '@safe-global/views/components/ui/tag'
import { useCopyToClipboard } from '@/components/common/AuditLog'
import { HINT_CLASS, ROW_TAG_FILL, chainLogoUrl } from './shared'

// An address shown as an avatar and a name. Clicking it does what its row does; clicking the tooltip copies the address.
export function CopyableParty({
  name,
  address,
  avatar = address,
  mono = false,
  tone,
  logo,
  contract = false,
  tag = false,
  network,
}: {
  name: string
  address: string
  avatar?: string
  // The name is itself a short address.
  mono?: boolean
  tone?: 'destructive'
  // A contract shows its logo, or the code icon when it has none, as production does.
  logo?: string
  contract?: boolean
  // Option E: the party as a tag, like the type tag.
  tag?: boolean
  // Option E: the Safe's network, as a logo after the name inside its tag.
  network?: { chainId: string; name: string }
}) {
  const [copied, copy] = useCopyToClipboard(address)
  const CopyIcon = copied ? Check : Copy
  // Grey until the row or the avatar is hovered, so colour doesn't compete with the type tag.
  const avatarIcon = (size: number) => (
    <span className="flex shrink-0 grayscale transition-[filter] group-hover/transaction:grayscale-0 group-hover/party:grayscale-0">
      {contract ? (
        <Avatar style={{ width: size, height: size }}>
          {logo && <AvatarImage src={logo} alt="" />}
          <AvatarFallback>
            <FileCode2 className="size-3.5 text-muted-foreground" strokeWidth={ICON_STROKE} aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <Identicon address={avatar} size={size} />
      )}
    </span>
  )
  return (
    <Tooltip delay={150}>
      <TooltipTrigger
        render={<span className={`group/party flex min-w-0 shrink items-center ${tag ? ROW_TAG_FILL : 'gap-1.5'}`} />}
      >
        {tag ? (
          <Tag className="min-w-0 shrink gap-1.5 pl-1">
            {avatarIcon(16)}
            <span className={`truncate ${mono ? 'font-mono text-xs' : ''}`}>{name}</span>
            {network && (
              <img
                src={chainLogoUrl(network.chainId)}
                alt={`on ${network.name}`}
                className="size-4 shrink-0 rounded-full"
              />
            )}
          </Tag>
        ) : (
          <>
            {avatarIcon(24)}
            <span
              className={`truncate ${mono ? 'font-mono text-xs' : ''} ${tone === 'destructive' ? 'text-destructive' : ''}`}
            >
              {name}
            </span>
          </>
        )}
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
            <span className="block font-medium">
              {copied ? 'Copied' : mono ? 'Address' : network ? `${name} on ${network.name}` : name}
            </span>
            <span className="mt-1 block break-all font-mono">{address}</span>
          </span>
          <CopyIcon className="mt-0.5 size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      </TooltipContent>
    </Tooltip>
  )
}
