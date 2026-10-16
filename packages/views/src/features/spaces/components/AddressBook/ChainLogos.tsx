import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import type { ChainInfo } from './types'

const MAX_VISIBLE = 3

const ChainLogo = ({ chain }: { chain: ChainInfo }) =>
  chain.logoUri ? (
    <img src={chain.logoUri} alt={chain.name} className="ring-card size-5 rounded-full ring-2" loading="lazy" />
  ) : (
    <span className="bg-muted ring-card text-muted-foreground flex size-5 items-center justify-center rounded-full text-[9px] font-bold ring-2">
      {chain.name.slice(0, 2)}
    </span>
  )

/** Overlapping chain logos, "+N" past three; every chain name on hover. */
const ChainLogos = ({ chains }: { chains: ChainInfo[] }) => {
  const visible = chains.slice(0, MAX_VISIBLE)
  const rest = chains.length - visible.length
  const names = chains.map((chain) => chain.name).join(', ')

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="inline-flex cursor-default items-center" data-testid="chain-logos" />}
        aria-label={names}
      >
        <span className="flex -space-x-1.5">
          {visible.map((chain) => (
            <ChainLogo key={chain.chainId} chain={chain} />
          ))}
        </span>
        {rest > 0 && <span className="text-muted-foreground ml-1 text-xs">+{rest}</span>}
      </TooltipTrigger>
      <TooltipContent>{names}</TooltipContent>
    </Tooltip>
  )
}

export default ChainLogos
