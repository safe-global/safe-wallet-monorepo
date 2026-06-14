import { type ReactElement, useContext, useState, useEffect, useRef } from 'react'
import { ChevronDown, ExternalLink as LaunchIcon } from 'lucide-react'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import InfoIcon from '@/public/images/notifications/info.svg'
import UpdateIcon from '@/public/images/safe-shield/update.svg'
import { SeverityIcon } from './SeverityIcon'
import { TxInfoContext } from '@/components/tx-flow/TxInfoProvider'
import { useCurrentChain } from '@/hooks/useChains'
import {
  getSimulationOutcome,
  isTxSimulationEnabled,
  type SimulationTxParams,
} from '@safe-global/utils/components/tx/security/tenderly/utils'
import ExternalLink from '@/components/common/ExternalLink'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSigner } from '@/hooks/wallets/useWallet'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useSafeAddress from '@/hooks/useSafeAddress'
import type { SafeTransaction } from '@safe-global/types-kit'
import { SEVERITY_COLORS } from '@/features/safe-shield/constants'
import { useNestedTransaction } from './useNestedTransaction'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { trackEvent, SAFE_SHIELD_EVENTS, MixpanelEventParams } from '@/services/analytics'

interface TenderlySimulationProps {
  safeTx?: SafeTransaction
  highlightedSeverity?: Severity
  delay?: number
}

export const TenderlySimulation = ({
  safeTx,
  highlightedSeverity,
  delay = 0,
}: TenderlySimulationProps): ReactElement | null => {
  const { simulation, status, nestedTx } = useContext(TxInfoContext)
  const chain = useCurrentChain()
  const { safe } = useSafeInfo()
  const safeAddress = useSafeAddress()
  const signer = useSigner()
  const isSafeOwner = useIsSafeOwner()
  const showSimulation = chain && isTxSimulationEnabled(chain) && safeTx

  const [simulationExpanded, setSimulationExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Reset simulation state when transaction changes
  // Use useRef to track the previous transaction and only reset when it actually changes
  const prevTxDataRef = useRef<string | null>(null)

  useEffect(() => {
    const currentTxData = safeTx?.data ? JSON.stringify(safeTx.data) : null

    // Only reset if the transaction data actually changed
    if (currentTxData !== prevTxDataRef.current) {
      simulation.resetSimulation()
      nestedTx.simulation.resetSimulation()
      setSimulationExpanded(false)

      prevTxDataRef.current = currentTxData
    }
  }, [safeTx, simulation, nestedTx.simulation])

  const { nestedSafeInfo, nestedSafeTx, isNested } = useNestedTransaction(safeTx, chain)

  const handleToggleSimulation = () => {
    setSimulationExpanded(!simulationExpanded)
  }

  const handleRunSimulation = () => {
    if (!safeTx) return

    const executionOwner = isSafeOwner && signer?.address ? signer.address : safe.owners[0].value

    const simulationParams = {
      safe,
      executionOwner,
      transactions: safeTx,
      gasLimit: undefined,
    } as SimulationTxParams

    simulation.simulateTransaction(simulationParams)

    if (isNested) {
      const nestedSimulationParams = {
        safe: nestedSafeInfo,
        executionOwner: safeAddress,
        transactions: nestedSafeTx,
        gasLimit: undefined,
      } as SimulationTxParams

      nestedTx.simulation.simulateTransaction(nestedSimulationParams)
    }

    setSimulationExpanded(true)
  }

  const { mainIsSuccess, nestedIsSuccess, isSimulationSuccess, isSimulationFinished, isLoading } = getSimulationOutcome(
    status,
    nestedTx,
    isNested,
  )

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

  // Track simulation result when it finishes
  useEffect(() => {
    if (mainSimulationResult) {
      const results = [mainSimulationResult]

      if (nestedSimulationResult) {
        results.push(nestedSimulationResult)
      }

      trackEvent(SAFE_SHIELD_EVENTS.SIMULATED, {
        [MixpanelEventParams.RESULT]: results,
      })
    }
  }, [mainSimulationResult, nestedSimulationResult])

  useEffect(() => {
    if (!showSimulation) return

    setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }, [delay, showSimulation])

  if (!showSimulation) {
    return null
  }

  const showExpandable = isNested && isSimulationFinished

  const getSimulationHeaderText = () => {
    if (!isSimulationFinished) return 'Transaction simulation'
    if (isNested) return 'Transaction simulations'
    return isSimulationSuccess ? 'Simulation successful' : 'Simulation failed'
  }

  const isHighlihtedSeverityOK = isSimulationSuccess && highlightedSeverity === Severity.OK
  const isHighlihtedSeverityWarn = !isSimulationSuccess && highlightedSeverity === Severity.WARN

  const isMuted = !highlightedSeverity || (!isHighlihtedSeverityOK && !isHighlihtedSeverityWarn)

  const viewLink = (
    <Typography
      variant="paragraph-mini"
      className="leading-4 text-[var(--color-text-secondary)] underline [letter-spacing:1px]"
    >
      View
    </Typography>
  )

  return (
    <Collapsible
      open={simulationExpanded}
      data-testid="tenderly-simulation"
      className="overflow-hidden"
      style={{
        opacity: isVisible ? 1 : 0,
        maxHeight: isVisible ? 1000 : 0, // Replace 'fit-content' with a large px value for animatable maxHeight
        transition: `opacity 0.3s ease-in-out, max-height 0.3s ease-in-out`,
        transitionDelay: `${delay}ms`,
      }}
    >
      <div
        className={`flex flex-row items-center justify-between p-3 ${showExpandable ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={showExpandable ? handleToggleSimulation : undefined}
      >
        <div className="flex flex-row items-center gap-2">
          {isSimulationFinished ? (
            <SeverityIcon
              severity={isSimulationSuccess ? Severity.OK : Severity.WARN}
              muted={isMuted}
              width={16}
              height={16}
            />
          ) : (
            <UpdateIcon className="size-4" />
          )}
          <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
            {getSimulationHeaderText()}
          </Typography>
          {!isSimulationFinished && !isLoading && (
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

        {!isSimulationFinished ? (
          <button
            data-testid="run-simulation-btn"
            onClick={handleRunSimulation}
            disabled={isLoading}
            className={`rounded-[4px] border-none bg-transparent px-2 py-0.5 hover:bg-[var(--color-border-light)] ${
              isLoading ? 'cursor-default hover:bg-transparent' : 'cursor-pointer'
            }`}
          >
            <Typography variant="paragraph-mini" className="text-[var(--color-text-primary)] [letter-spacing:0.4px]">
              {isLoading ? 'Running...' : 'Run'}
            </Typography>
          </button>
        ) : isNested ? (
          <ChevronDown
            className={`size-4 text-[var(--color-text-secondary)] transition-transform ${
              simulationExpanded ? 'rotate-180' : ''
            }`}
          />
        ) : (
          simulation.simulationLink && (
            <ExternalLink noIcon href={simulation.simulationLink}>
              <span className="inline-flex items-center gap-1">
                {viewLink}
                <LaunchIcon className="size-4 text-[var(--color-text-secondary)]" />
              </span>
            </ExternalLink>
          )
        )}
      </div>

      {/* Show expandable content only for nested simulations */}
      <CollapsibleContent keepMounted>
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
                  {simulation.simulationLink && (
                    <ExternalLink noIcon href={simulation.simulationLink}>
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
                  {nestedTx.simulation.simulationLink && (
                    <ExternalLink noIcon href={nestedTx.simulation.simulationLink}>
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
