import { useRef, type ReactElement, type ReactNode } from 'react'
import Identicon from '@safe-global/views/components/common/Identicon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { ChainLogo } from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import { QUEUE_HINT_CLASS, QueueHintContent } from './QueueHint'

/** A value, or runs of it where the monospaced ones are nonces */
export type SafeBandDetail = { label: string; value: ReactNode | Array<{ text: string; mono?: boolean }> }

/** The band's Safe card: its name, full address and facts such as its networks and threshold */
export const SafeBandCard = ({
  name,
  address,
  details,
}: {
  name: string
  address: string
  details: SafeBandDetail[]
}): ReactElement => (
  <>
    <QueueHintContent title={name} body={<span className="break-all font-mono">{address}</span>} />
    {details.length > 0 && (
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {details.map(({ label, value }) => (
          <div key={label} className="contents">
            <dt className="opacity-70">{label}</dt>
            <dd>
              {Array.isArray(value)
                ? value.map(({ text, mono }, index) =>
                    mono ? (
                      <span key={index} className="font-mono">
                        {text}
                      </span>
                    ) : (
                      text
                    ),
                  )
                : value}
            </dd>
          </div>
        ))}
      </dl>
    )}
  </>
)

export type SafeBandChain = {
  chain: ChainInfo
  /** Its transactions are hidden */
  collapsed: boolean
  /** The button's label: what a click shows */
  label: string
  onClick: () => void
}

type SafeBandTitleProps = {
  safeAddress: string
  name: string
  /** A SafeBandCard, mounted only while the card is open */
  card: ReactNode
  chains: SafeBandChain[]
  defaultOpen?: boolean
}

/** The Safe band's title: its avatar and name, with the Safe card, then a button per network */
const SafeBandTitle = ({ safeAddress, name, card, chains, defaultOpen }: SafeBandTitleProps): ReactElement => {
  const avatarRef = useRef<HTMLSpanElement>(null)
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Tooltip defaultOpen={defaultOpen}>
        <TooltipTrigger
          render={
            <span
              data-testid="safe-band-identity"
              tabIndex={0}
              className="flex min-w-0 items-center gap-3 rounded-sm outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          }
        >
          <span ref={avatarRef} className="flex shrink-0">
            <Identicon address={safeAddress} size={24} />
          </span>
          <span className="truncate font-medium text-foreground">{name}</span>
        </TooltipTrigger>
        {/* Points at the avatar, not the middle of a long name */}
        <TooltipContent anchor={avatarRef} className={QUEUE_HINT_CLASS}>
          {card}
        </TooltipContent>
      </Tooltip>
      <span className="flex shrink-0 -space-x-1">
        {chains.map(({ chain, collapsed, label, onClick }) => (
          <Tooltip key={chain.chainId}>
            <TooltipTrigger
              aria-label={label}
              aria-expanded={!collapsed}
              className="relative flex rounded-full hover:z-10 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-ring"
              onClick={(event) => {
                event.stopPropagation()
                onClick()
              }}
            >
              <span className={`flex transition-[filter,opacity] ${collapsed ? 'opacity-50 grayscale' : ''}`}>
                <ChainLogo chain={chain} size="sm" />
              </span>
            </TooltipTrigger>
            <TooltipContent>{chain.chainName}</TooltipContent>
          </Tooltip>
        ))}
      </span>
    </span>
  )
}

export default SafeBandTitle
