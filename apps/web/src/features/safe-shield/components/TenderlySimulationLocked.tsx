import type { ReactElement } from 'react'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { Typography } from '@/components/ui/typography'
import { useCurrentChain } from '@/hooks/useChains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { LockedCheckRow } from './LockedCheckRow'

/**
 * The simulation row without Safe Pro and without a Tenderly project of one's own: nothing is called, and "Set"
 * leads to the settings where the user can bring their own project. The Pro header above carries the upgrade.
 */
export const TenderlySimulationLocked = (): ReactElement | null => {
  const chain = useCurrentChain()
  const router = useRouter()
  if (!chain || !hasFeature(chain, FEATURES.TX_SIMULATION)) return null

  return (
    <LockedCheckRow
      data-testid="tenderly-simulation-locked"
      tooltip="Built-in simulation is part of Safe Pro. To simulate on your own Tenderly project, add its URL and access token in Settings › Environment variables."
      action={
        <NextLink
          href={{ pathname: AppRoutes.settings.environmentVariables, query: { safe: router.query.safe } }}
          data-testid="set-simulation-link"
          className="inline-flex items-center rounded-[4px] bg-[var(--color-border-light)] px-2 py-0.5 no-underline hover:bg-[var(--color-border-main)]"
        >
          <Typography variant="paragraph-mini" className="text-[var(--color-text-primary)] [letter-spacing:0.4px]">
            Set
          </Typography>
        </NextLink>
      }
    >
      Transaction simulation
    </LockedCheckRow>
  )
}
