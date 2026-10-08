import { type ReactElement } from 'react'
import { ChevronDown, ExternalLink as LaunchIcon } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import InfoIcon from '@/public/images/notifications/info.svg'
import UpdateIcon from '@/public/images/safe-shield/update.svg'
import type { Severity } from '@safe-global/utils/features/safe-shield/types'
import ExternalLink from '@/components/common/ExternalLink'
import { SEVERITY_COLORS } from '@/features/safe-shield/constants'
import { SeverityIcon } from '@views/features/safe-shield/components/SeverityIcon'

export interface TenderlySimulationViewProps {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  isVisible: boolean
  delay: number
  showExpandable: boolean
  isSimulationFinished: boolean
  isSimulationSuccess: boolean
  /** Severity shown once the simulation has finished. */
  resultSeverity: Severity
  isMuted: boolean
  isNested: boolean
  isLoading: boolean
  isNestedLoading: boolean
  autoRun: boolean
  onRun: () => void
  mainIsSuccess: boolean
  nestedIsSuccess: boolean
  simulationLink?: string
  nestedSimulationLink?: string
}

export const TenderlySimulationView = ({
  expanded,
  onExpandedChange,
  isVisible,
  delay,
  showExpandable,
  isSimulationFinished,
  isSimulationSuccess,
  resultSeverity,
  isMuted,
  isNested,
  isLoading,
  isNestedLoading,
  autoRun,
  onRun,
  mainIsSuccess,
  nestedIsSuccess,
  simulationLink,
  nestedSimulationLink,
}: TenderlySimulationViewProps): ReactElement => {
  const getSimulationHeaderText = () => {
    if (!isSimulationFinished) return 'Transaction simulation'
    if (isNested) return 'Transaction simulations'
    return isSimulationSuccess ? 'Simulation successful' : 'Simulation failed'
  }

  const mainSimulationResult = isSimulationFinished
    ? mainIsSuccess
      ? 'Simulation successful.'
      : 'Simulation failed.'
    : undefined

  const nestedSimulationResult =
    isNested && isSimulationFinished
      ? nestedIsSuccess
        ? 'Nested transaction simulation successful.'
        : 'Nested transaction simulation failed.'
      : undefined

  const viewLink = (
    <Typography
      variant="paragraph-mini"
      className="leading-4 text-[var(--color-text-secondary)] underline [letter-spacing:1px]"
    >
      View
    </Typography>
  )

  const header = (
    <>
      <div className="flex flex-row items-center gap-2">
        {isSimulationFinished ? (
          <SeverityIcon severity={resultSeverity} muted={isMuted} width={16} height={16} />
        ) : (
          <UpdateIcon className="size-4" />
        )}
        <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
          {getSimulationHeaderText()}
        </Typography>
        {!isSimulationFinished && !isLoading && !autoRun && (
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <InfoIcon className="size-4 text-[var(--color-border-main)]" />
            </TooltipTrigger>
            <TooltipContent className="text-center">
              Run a simulation to see if the transaction will succeed and get a full report.
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {!isSimulationFinished && autoRun ? (
        <Typography variant="paragraph-mini" className="text-[var(--color-text-secondary)] [letter-spacing:0.4px]">
          {isLoading || isNestedLoading ? 'Running...' : ''}
        </Typography>
      ) : !isSimulationFinished ? (
        <button
          data-testid="run-simulation-btn"
          onClick={onRun}
          disabled={isLoading}
          className={`rounded-[4px] border-none bg-[var(--color-border-light)] px-2 py-0.5 hover:bg-[var(--color-border-main)] ${
            isLoading ? 'cursor-default hover:bg-[var(--color-border-light)]' : 'cursor-pointer'
          }`}
        >
          <Typography variant="paragraph-mini" className="text-[var(--color-text-primary)] [letter-spacing:0.4px]">
            {isLoading ? 'Running...' : 'Run'}
          </Typography>
        </button>
      ) : isNested ? (
        <ChevronDown
          className={`size-4 text-[var(--color-text-secondary)] transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      ) : (
        simulationLink && (
          <ExternalLink noIcon href={simulationLink}>
            <span className="inline-flex items-center gap-1">
              {viewLink}
              <LaunchIcon className="size-4 text-[var(--color-text-secondary)]" />
            </span>
          </ExternalLink>
        )
      )}
    </>
  )

  return (
    <Collapsible
      open={expanded}
      onOpenChange={onExpandedChange}
      data-testid="tenderly-simulation"
      className="overflow-hidden"
      style={{
        opacity: isVisible ? 1 : 0,
        maxHeight: isVisible ? 1000 : 0, // Replace 'fit-content' with a large px value for animatable maxHeight
        transition: `opacity 0.3s ease-in-out, max-height 0.3s ease-in-out`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* A trigger only when expandable: before the run finishes the header holds the Run button. */}
      {showExpandable ? (
        <CollapsibleTrigger
          nativeButton={false}
          render={<div className="flex cursor-pointer flex-row items-center justify-between p-3" />}
        >
          {header}
        </CollapsibleTrigger>
      ) : (
        <div className="flex cursor-default flex-row items-center justify-between p-3">{header}</div>
      )}

      {/* Show expandable content only for nested simulations */}
      <CollapsibleContent>
        {showExpandable && (
          <div className="px-3 pt-1 pb-4">
            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-[4px] bg-[var(--color-background-main)]">
                <div
                  className="border-l-4 p-3"
                  style={{ borderLeftColor: mainIsSuccess ? SEVERITY_COLORS.OK.main : SEVERITY_COLORS.CRITICAL.main }}
                >
                  <Typography variant="paragraph-small" className="mb-2 block text-[var(--color-primary-light)]">
                    {mainSimulationResult}
                  </Typography>
                  {simulationLink && (
                    <ExternalLink noIcon href={simulationLink}>
                      <span className="inline-flex items-center gap-1">
                        {viewLink}
                        <LaunchIcon className="size-4 text-[var(--color-text-secondary)]" />
                      </span>
                    </ExternalLink>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-[4px] bg-[var(--color-background-main)]">
                <div
                  className="border-l-4 p-3"
                  style={{ borderLeftColor: nestedIsSuccess ? SEVERITY_COLORS.OK.main : SEVERITY_COLORS.CRITICAL.main }}
                >
                  <Typography variant="paragraph-small" className="mb-2 block text-[var(--color-primary-light)]">
                    {nestedSimulationResult}
                  </Typography>
                  {nestedSimulationLink && (
                    <ExternalLink noIcon href={nestedSimulationLink}>
                      <span className="inline-flex items-center gap-1">
                        {viewLink}
                        <LaunchIcon className="size-4 text-[var(--color-text-secondary)]" />
                      </span>
                    </ExternalLink>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
