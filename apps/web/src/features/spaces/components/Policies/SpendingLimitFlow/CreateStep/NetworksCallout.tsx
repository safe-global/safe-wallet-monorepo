import type { ReactElement } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSpendingLimitChains } from '../hooks/useSpendingLimitSafeAccounts'
import { getNetworksCountLabel, NETWORKS_CALLOUT_TITLE } from '../constants'

const NetworksCallout = (): ReactElement | null => {
  const chains = useSpendingLimitChains()

  if (chains.length === 0) return null

  return (
    <Alert
      variant="info"
      className="*:data-[slot=alert-description]:text-muted-foreground"
      data-testid="networks-callout"
    >
      <AlertSeverityIcon variant="info" />
      <AlertTitle>{NETWORKS_CALLOUT_TITLE}</AlertTitle>
      <AlertDescription>
        Spending limits are available on{' '}
        <Tooltip>
          <TooltipTrigger
            render={<span tabIndex={0} />}
            className="underline decoration-dotted underline-offset-2"
            data-testid="networks-callout-count"
          >
            {getNetworksCountLabel(chains.length)}
          </TooltipTrigger>
          <TooltipContent className="max-w-64">{chains.map((chain) => chain.chainName).join(', ')}</TooltipContent>
        </Tooltip>
        .
      </AlertDescription>
    </Alert>
  )
}

export default NetworksCallout
