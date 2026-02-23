import ChainIndicator from '@/components/common/ChainIndicator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { NetworkLogosList } from '@/features/multichain'
import type { SafeItem } from '@/hooks/safes'

export interface AccountItemChainBadgeProps {
  /** Single chain mode */
  chainId?: string
  /** Multi-chain mode - renders network logos with tooltip */
  safes?: SafeItem[]
}

function AccountItemChainBadge({ chainId, safes }: AccountItemChainBadgeProps) {
  // Multi-chain mode: render NetworkLogosList with tooltip
  if (safes && safes.length > 0) {
    return (
      <div className="flex shrink-0 justify-end">
        <Tooltip>
          <TooltipTrigger className="flex items-center">
            <NetworkLogosList networks={safes} showHasMore />
          </TooltipTrigger>
          <TooltipContent>
            <div data-testid="multichain-tooltip">
              <p className="text-sm">Multichain account on:</p>
              {safes.map((safeItem) => (
                <div key={safeItem.chainId} className="py-1">
                  <ChainIndicator chainId={safeItem.chainId} />
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    )
  }

  // Single chain mode: render ChainIndicator
  if (chainId) {
    return (
      <div className="shrink-0">
        <ChainIndicator chainId={chainId} responsive onlyLogo className="justify-end" />
      </div>
    )
  }

  return null
}

export default AccountItemChainBadge
