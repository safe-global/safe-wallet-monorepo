import { ArrowUpRight, BookUser, Check, Copy, FileCode2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import Identicon from '@safe-global/views/components/common/Identicon'
import { Tag } from '@safe-global/views/components/ui/tag'
import { useCopyToClipboard } from '@/components/common/AuditLog'
import { ROW_TAG_FILL, chainLogoUrl } from './shared'
import { EXPLORERS } from './ReviewDrawer/steps/IdentityRow'

const EXPLORER_NAMES: Record<string, string> = { '1': 'Etherscan', '8453': 'Basescan', '42161': 'Arbiscan' }
// Light text on the dark tooltip
const ACTION_CLASS = 'text-background hover:bg-background/10 hover:text-background'

// An address shown as an avatar and a name. Clicking it does what its row does.
// The tooltip copies the address, opens it on the explorer and, when it isn't in the address book, adds it.
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
  chainId = network?.chainId,
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
  // The party as a tag, like the type tag.
  tag?: boolean
  // The Safe's network, as a logo after the name inside its tag.
  network?: { chainId: string; name: string }
  chainId?: string
}) {
  const [copied, copy] = useCopyToClipboard(address)
  // Stands in for the address book dialog the transaction flow already has.
  const [added, setAdded] = useState(false)
  const explorer =
    chainId && EXPLORERS[chainId] ? { url: EXPLORERS[chainId], name: EXPLORER_NAMES[chainId] ?? 'Explorer' } : undefined
  // Grey until the row or the avatar is hovered, so colour doesn't compete with the type tag.
  const avatarIcon = (size: number, color = false) => (
    <span
      className={`flex shrink-0 ${color ? '' : 'grayscale transition-[filter] group-hover/transaction:grayscale-0 group-hover/party:grayscale-0'}`}
    >
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
      <TooltipContent className="max-w-none">
        <span className="flex flex-col gap-2.5 py-1" onClick={(event) => event.stopPropagation()}>
          <span className="flex items-center gap-2.5">
            {avatarIcon(32, true)}
            <span className="min-w-0">
              <span className="block font-medium">
                {mono ? 'Not in your address book' : network ? `${name} on ${network.name}` : name}
              </span>
              <span className="block whitespace-nowrap font-mono text-background/70">{address}</span>
            </span>
          </span>
          <span className="-mx-2 flex items-center gap-1 border-t border-background/15 pt-1.5">
            <Button variant="ghost" size="2xs" className={ACTION_CLASS} onClick={copy}>
              {copied ? <Check strokeWidth={ICON_STROKE} /> : <Copy strokeWidth={ICON_STROKE} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            {mono && (
              <Button
                variant="ghost"
                size="2xs"
                className={ACTION_CLASS}
                onClick={() => setAdded(true)}
                disabled={added}
              >
                {added ? <Check strokeWidth={ICON_STROKE} /> : <BookUser strokeWidth={ICON_STROKE} />}
                {added ? 'Added' : 'Add to address book'}
              </Button>
            )}
            {explorer && (
              <Button
                variant="ghost"
                size="2xs"
                className={`ml-auto ${ACTION_CLASS}`}
                render={<a href={`${explorer.url}${address}`} target="_blank" rel="noreferrer" />}
              >
                {explorer.name}
                <ArrowUpRight strokeWidth={ICON_STROKE} />
              </Button>
            )}
          </span>
        </span>
      </TooltipContent>
    </Tooltip>
  )
}
