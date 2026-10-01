import { useContext, useEffect, type ReactElement } from 'react'
import { ArrowUpRight, Info, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as HnQueueAssessment)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { getSafeTxHashFromTxId } from '@/utils/transactions'
import { useCurrentChain } from '@/hooks/useChains'
import { SAFENET_EXPLORER_URL } from '@safe-global/utils/features/safenet-checks/constants'
import { cn } from '@/utils/cn'
import {
  PHASE_PRESENTATION,
  SAFENET_EXPLAINER_COPY,
  SAFENET_EXPLAINER_TITLE,
  SHIELD_ROW_COPY,
  isRunningPhase,
  isVerdictPhase,
} from '../copy'
import type { SafenetCheckState } from '../types'
import { resolveRole, useSafenetCheckState } from '../useSafenetCheckState'
import { useSafenetScenario } from '../useSafenetScenario'
import { SafenetPulse } from './SafenetPulse'
import { SafenetShieldFootView } from './SafenetShieldFoot'

export type SafenetShieldRowViewProps = {
  state: SafenetCheckState
  explorerHref?: string
  onEnable?: () => void
}

const RowMark = ({ state }: { state: SafenetCheckState }): ReactElement => {
  if (isRunningPhase(state.phase)) return <SafenetPulse />
  if (state.phase === 'locked') return <LockKeyhole className="size-4 shrink-0 text-muted-foreground" aria-hidden />
  const { severity, muted } = PHASE_PRESENTATION[state.phase]
  return <SeverityIcon severity={severity} muted={muted} />
}

/** Safenet's row in the Safe Shield panel: a short title over a sub-line, like the other checks. */
export const SafenetShieldRowView = ({ state, explorerHref, onEnable }: SafenetShieldRowViewProps): ReactElement => {
  const { title, sub } = SHIELD_ROW_COPY[state.phase]
  const isRisk = state.phase === 'risk'

  return (
    <div data-testid="safenet-shield-row" data-phase={state.phase}>
      <div className="flex items-start gap-2.5 px-3 py-3">
        <span className="mt-0.5">
          <RowMark state={state} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col" aria-live="polite">
          <span className="flex items-center gap-1">
            <Typography
              variant="paragraph-small"
              className={cn(
                'leading-5',
                isRisk ? 'text-[var(--color-error-dark)]' : 'text-[var(--color-primary-light)]',
              )}
            >
              {title}
            </Typography>
            {(isRunningPhase(state.phase) || state.phase === 'before-sign') && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label={SAFENET_EXPLAINER_TITLE}
                      className="inline-flex rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                    />
                  }
                >
                  <Info className="size-3.5" aria-hidden />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-60">
                  <strong className="block">{SAFENET_EXPLAINER_TITLE}</strong>
                  {SAFENET_EXPLAINER_COPY}
                </TooltipContent>
              </Tooltip>
            )}
          </span>
          <Typography variant="paragraph-mini" color="muted">
            {sub}
          </Typography>
          {state.riskDetails && (
            <Typography variant="paragraph-mini" className="mt-1" data-testid="safenet-risk-details">
              {state.riskDetails}
            </Typography>
          )}
        </div>
        {state.phase === 'locked' && onEnable && (
          <Button variant="outline" size="xs" onClick={onEnable}>
            Turn on
          </Button>
        )}
      </div>

      {isVerdictPhase(state.phase) && explorerHref && (
        <a
          href={explorerHref}
          target="_blank"
          rel="noreferrer noopener"
          data-testid="safenet-explorer-link"
          className={cn(
            'group flex items-center gap-2.5 border-t border-border px-3 py-3 text-sm font-medium outline-none transition-colors hover:underline focus-visible:underline',
            isRisk
              ? 'hover:bg-[var(--color-error-background)] hover:text-[var(--color-error-dark)]'
              : 'hover:bg-[var(--color-success-background)] hover:text-[var(--color-success-dark)]',
          )}
        >
          <ArrowUpRight
            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-current"
            aria-hidden
          />
          View on Safenet explorer
        </a>
      )}
    </div>
  )
}

/** Safenet check row in the Safe Shield panel. Reports its phase so the header and risk acknowledgement follow it. */
export const SafenetShieldRow = (): ReactElement | null => {
  const { isCreation, willExecute, onlyExecute, txId } = useContext(TxFlowContext)
  const { scenario, updateScenario } = useSafenetScenario()
  const { setSafenetPhase } = useSafeShield()
  const chainId = useCurrentChain()?.chainId
  const check = useSafenetCheckState(resolveRole(scenario.role, { isCreation, willExecute, onlyExecute }))
  const phase = check?.state.phase

  useEffect(() => {
    setSafenetPhase(phase)
    return () => setSafenetPhase(undefined)
  }, [phase, setSafenetPhase])

  if (!check) return null

  const safeTxHash = txId ? getSafeTxHashFromTxId(txId) : undefined
  // MOCK: the real link targets the attestation; this is the explorer's safeTx route.
  const explorerHref = safeTxHash
    ? `${SAFENET_EXPLORER_URL}/#/safeTx?chainId=${chainId}&safeTxHash=${safeTxHash}`
    : SAFENET_EXPLORER_URL

  return (
    <div>
      <SafenetShieldRowView
        state={check.state}
        explorerHref={explorerHref}
        onEnable={() => updateScenario({ enhancedExecution: true })}
      />
      {isRunningPhase(check.state.phase) && <SafenetShieldFootView state={check.state} nowMs={check.nowMs} />}
    </div>
  )
}

export default SafenetShieldRow
