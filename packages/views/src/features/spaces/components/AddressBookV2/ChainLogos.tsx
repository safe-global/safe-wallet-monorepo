import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import { cn } from '@safe-global/views/utils/cn'

const MAX_VISIBLE = 3

const LOGO_SIZES = { sm: 'size-4', md: 'size-5' } as const

type LogoSize = keyof typeof LOGO_SIZES

const ChainLogo = ({ chain, size }: { chain: ChainInfo; size: LogoSize }) =>
  chain.chainLogoUri ? (
    <img
      src={chain.chainLogoUri}
      alt={chain.chainName}
      className={cn('ring-card rounded-full ring-2', LOGO_SIZES[size])}
      loading="lazy"
    />
  ) : (
    <span
      className={cn(
        'bg-muted ring-card text-muted-foreground flex items-center justify-center rounded-full text-[9px] font-bold ring-2',
        LOGO_SIZES[size],
      )}
    >
      {chain.chainName.slice(0, 2)}
    </span>
  )

/** Overlapping chain logos with a "+N" overflow; every chain name on hover. */
const ChainLogos = ({ chains, size = 'md' }: { chains: ChainInfo[]; size?: LogoSize }) => {
  const visible = chains.slice(0, MAX_VISIBLE)
  const rest = chains.length - visible.length
  const names = chains.map((chain) => chain.chainName).join(', ')

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="inline-flex cursor-default items-center" data-testid="chain-logos" />}
        aria-label={names}
      >
        <span className="flex -space-x-1.5">
          {visible.map((chain) => (
            <ChainLogo key={chain.chainId} chain={chain} size={size} />
          ))}
        </span>
        {rest > 0 && <span className="text-muted-foreground ml-1 text-xs">+{rest}</span>}
      </TooltipTrigger>
      <TooltipContent>{names}</TooltipContent>
    </Tooltip>
  )
}

export default ChainLogos
