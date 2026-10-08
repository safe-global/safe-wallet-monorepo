import type { ComponentProps, ReactElement } from 'react'
import NextLink from 'next/link'
import { Typography } from '@/components/ui/typography'
import { LockedCheckRow } from '@views/features/safe-shield/components/LockedCheckRow'

export type TenderlySimulationLockedViewProps = {
  settingsHref: ComponentProps<typeof NextLink>['href']
}

export const TenderlySimulationLockedView = ({ settingsHref }: TenderlySimulationLockedViewProps): ReactElement => {
  return (
    <LockedCheckRow
      data-testid="tenderly-simulation-locked"
      tooltip="Built-in simulation is part of Safe Pro. To simulate on your own Tenderly project, add its URL and access token in Settings › Environment variables."
      action={
        <NextLink
          href={settingsHref}
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
