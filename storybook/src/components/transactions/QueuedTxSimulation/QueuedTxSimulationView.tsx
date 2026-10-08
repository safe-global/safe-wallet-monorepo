import type { ComponentProps, ReactNode } from 'react'
import NextLink from 'next/link'
import TenderlyIcon from '@/public/images/transactions/tenderly-small.svg'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '@/components/common/ExternalLink'
import CheckIcon from '@/public/images/common/check.svg'
import CloseIcon from '@/public/images/common/close.svg'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const _getSimulationIcon = (isSuccessful: boolean) =>
  isSuccessful
    ? { color: 'var(--color-success-main)', Component: CheckIcon }
    : { color: 'var(--color-error-main)', Component: CloseIcon }

export const _getSimulationStatusText = (isSuccessful: boolean) =>
  isSuccessful ? 'Simulation successful' : 'Simulation failed'

const CompactSimulationButton = ({
  label,
  iconComponent,
  disabled = false,
  onClick,
}: {
  label: string
  iconComponent: ReactNode
  disabled?: boolean
  onClick?: () => void
}) => {
  return (
    <Button
      variant="ghost"
      disabled={disabled}
      // visibility is required as the icon otherwise disappears when the first tx accordion is closed
      // eslint-disable-next-line no-restricted-syntax -- inline simulation toggle: custom size + surface bg; pending a variant
      className="flex flex-row items-center gap-1 rounded-lg !visible h-auto bg-[var(--color-background-main)] py-1 hover:bg-[var(--color-background-main)]"
      onClick={onClick}
    >
      {iconComponent}
      <Typography variant="paragraph-small-bold">{label}</Typography>
    </Button>
  )
}

export type SimulationSetupLinkViewProps = {
  href: ComponentProps<typeof NextLink>['href']
}

export const SimulationSetupLinkView = ({ href }: SimulationSetupLinkViewProps) => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <NextLink
            href={href}
            data-testid="queued-tx-simulation-setup"
            className="flex flex-row items-center gap-1 rounded-lg bg-[var(--color-background-main)] px-2 py-1 no-underline"
          >
            <TenderlyIcon className="h-4" />
            <Typography variant="paragraph-small-bold">Set up simulation</Typography>
          </NextLink>
        }
      />
      <TooltipContent>
        Built-in simulation is part of Safe Pro. To simulate on your own Tenderly project, add its URL and access token
        in Settings › Environment variables.
      </TooltipContent>
    </Tooltip>
  )
}

export type QueuedTxSimulationViewProps = {
  isLoading?: boolean
  isError?: boolean
  result?: { isSuccessful: boolean; simulationLink: string }
  disabled?: boolean
  onSimulate?: () => void
}

export const QueuedTxSimulationView = ({
  isLoading,
  isError,
  result,
  disabled = false,
  onSimulate,
}: QueuedTxSimulationViewProps) => {
  if (isLoading) {
    return <CompactSimulationButton label="Simulating" iconComponent={<Spinner className="size-4" />} disabled={true} />
  }

  if (result) {
    const { color, Component } = _getSimulationIcon(result.isSuccessful)
    return (
      <ExternalLink href={result.simulationLink}>
        <div className="flex flex-row items-center gap-1">
          <Component className="h-4" style={{ color }} />
          {_getSimulationStatusText(result.isSuccessful)}
        </div>
      </ExternalLink>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-row items-center gap-1">
        <CloseIcon className="h-4 text-[var(--color-error-main)]" />
        Error while simulating
      </div>
    )
  }

  return (
    <CompactSimulationButton
      label="Simulate"
      iconComponent={<TenderlyIcon className="h-4" />}
      disabled={disabled}
      onClick={onSimulate}
    />
  )
}
