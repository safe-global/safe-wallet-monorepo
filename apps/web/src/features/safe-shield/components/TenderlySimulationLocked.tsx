import type { ReactElement } from 'react'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { Typography } from '@/components/ui/typography'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { LockedCheckRow } from './LockedCheckRow'

/** Without Pro or an own Tenderly project nothing is called; "Set" leads to settings to bring one's own project. */
export const TenderlySimulationLocked = (): ReactElement | null => {
  const hasSimulation = useHasFeature(FEATURES.TX_SIMULATION) === true
  const router = useRouter()
  if (!hasSimulation) return null

  return (
    <LockedCheckRow
      data-testid="tenderly-simulation-locked"
      tooltip="Built-in simulation is part of Safe Pro. To simulate on your own Tenderly project, add its URL and access token in Settings › Environment variables."
      action={
        <NextLink
          href={{ pathname: AppRoutes.settings.environmentVariables, query: { safe: router.query.safe } }}
          data-testid="set-simulation-link"
          className="inline-flex items-center rounded-2xs bg-[var(--color-border-light)] px-2 py-0.5 no-underline hover:bg-[var(--color-border-main)]"
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
