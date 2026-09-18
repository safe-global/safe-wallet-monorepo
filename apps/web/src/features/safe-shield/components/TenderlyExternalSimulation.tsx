import { useEffect, useState, type ReactElement } from 'react'
import { ExternalLink as LaunchIcon } from 'lucide-react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '@/components/common/ExternalLink'
import InfoIcon from '@/public/images/notifications/info.svg'
import LockIcon from '@/public/images/common/lock-small.svg'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import { getPublicSimulatorLink } from '@safe-global/utils/components/tx/security/tenderly/utils'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

/** The Safe Pro-less counterpart of `TenderlySimulation`: no call to our simulator, just a hand-off to Tenderly's. */
export const TenderlyExternalSimulation = ({
  safeTx,
  delay = 0,
}: {
  safeTx?: SafeTransaction
  delay?: number
}): ReactElement | null => {
  const chain = useCurrentChain()
  const safeAddress = useSafeAddress()
  const [isVisible, setIsVisible] = useState(false)
  // Only the chain flag matters here: nothing is sent to our simulator endpoint.
  const showSimulation = chain && hasFeature(chain, FEATURES.TX_SIMULATION) && safeTx

  useEffect(() => {
    if (!showSimulation) return
    const id = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(id)
  }, [delay, showSimulation])

  if (!showSimulation) return null

  const href = getPublicSimulatorLink({
    chainId: chain.chainId,
    from: safeAddress,
    to: safeTx.data.to,
    value: safeTx.data.value,
    data: safeTx.data.data,
  })

  return (
    <div
      data-testid="tenderly-external-simulation"
      className="flex flex-row items-center justify-between p-3"
      style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s ease-in-out', transitionDelay: `${delay}ms` }}
    >
      <div className="flex flex-row items-center gap-2">
        <LockIcon className="size-4 text-[var(--color-text-disabled)]" />
        <Typography variant="paragraph-small" className="text-[var(--color-text-disabled)]">
          Transaction simulation
        </Typography>
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            <InfoIcon className="size-4 text-[var(--color-border-main)]" />
          </TooltipTrigger>
          <TooltipContent className="text-center">
            Built-in simulation is part of Safe Pro. You can still simulate this transaction on Tenderly.
          </TooltipContent>
        </Tooltip>
      </div>
      <ExternalLink href={href} noIcon data-testid="tenderly-external-link">
        <Typography
          variant="paragraph-mini"
          className="flex items-center gap-1 leading-4 underline [letter-spacing:1px]"
        >
          Open in Tenderly
          <LaunchIcon className="size-3" />
        </Typography>
      </ExternalLink>
    </div>
  )
}
