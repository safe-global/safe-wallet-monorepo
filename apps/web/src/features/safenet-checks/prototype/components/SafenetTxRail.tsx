import { useContext, type ReactElement } from 'react'
import { Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import { cn } from '@/utils/cn'
import { getEtaCopy, isRunningPhase, PHASE_PRESENTATION } from '../copy'
import type { SafenetCheckState } from '../types'
import { resolveRole, useSafenetCheckState } from '../useSafenetCheckState'
import { useSafenetScenario } from '../useSafenetScenario'

export type RailStep = 'create' | 'confirm' | 'sign' | 'execute'
type NodeState = 'done' | 'now' | 'pending'

const STEPS: Array<{ key: RailStep; title: string; sub: string }> = [
  { key: 'create', title: 'Create', sub: 'Amount and recipient' },
  { key: 'confirm', title: 'Confirm', sub: 'Review the details' },
  { key: 'sign', title: 'Sign', sub: 'Offchain · free' },
  { key: 'execute', title: 'Execute', sub: 'On-chain · costs gas' },
]

/** Safenet's line under the Sign step. */
export const getRailSafenetNote = (state: SafenetCheckState, nowMs: number): string => {
  if (state.phase === 'before-sign') return 'Safenet starts here'
  const label = `Safenet ${PHASE_PRESENTATION[state.phase].label.toLowerCase()}`
  return state.phase === 'checking' ? `${label} · ${getEtaCopy(state.etaMs, nowMs)}` : label
}

/** Which rail step the flow is on: the last flow step signs or executes, the one before it confirms. */
export const getRailStep = ({
  step,
  stepCount,
  willExecute,
}: {
  step: number
  stepCount: number
  willExecute: boolean
}): RailStep => {
  if (step >= stepCount - 1) return willExecute ? 'execute' : 'sign'
  return step === stepCount - 2 ? 'confirm' : 'create'
}

const Bead = ({ state }: { state: NodeState }): ReactElement => (
  <span
    className={cn(
      'relative z-[2] grid size-4 shrink-0 place-items-center rounded-full border-[1.5px]',
      state === 'done' &&
        'border-[var(--color-success-light)] bg-[var(--color-success-background)] text-[var(--color-success-main)]',
      state === 'now' && 'border-foreground bg-foreground ring-[3.5px] ring-foreground/15',
      state === 'pending' && 'border-border bg-muted',
    )}
  >
    {state === 'done' && <Check className="size-2.5" strokeWidth={3} aria-hidden />}
    {state === 'now' && <span className="size-[5px] rounded-full bg-background" />}
  </span>
)

export type SafenetTxRailViewProps = {
  current: RailStep
  safenet?: { state: SafenetCheckState; nowMs: number }
  signatures?: { submitted: number; required: number }
}

/** The tx flow's left rail with Safenet folded in under the Sign step. Labels collapse below 1200px. */
export const SafenetTxRailView = ({ current, safenet, signatures }: SafenetTxRailViewProps): ReactElement => {
  const currentIndex = STEPS.findIndex(({ key }) => key === current)
  const phase = safenet?.state.phase
  const isFlagged = phase === 'risk' || phase === 'unavailable'

  return (
    <Card
      as="nav"
      size="none"
      variant="outlined"
      radius="lg"
      aria-label="Transaction steps"
      data-testid="safenet-tx-rail"
      className="w-14 min-[1200px]:w-[240px] min-[1440px]:w-[320px]"
    >
      <div className="flex h-9 items-center gap-2 border-b border-border bg-muted px-3">
        <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground" aria-hidden />
        <Typography
          variant="paragraph-mini-bold"
          className="sr-only uppercase text-muted-foreground min-[1200px]:not-sr-only"
        >
          Transaction
        </Typography>
      </div>
      <ol className="px-3 pt-3 pb-1.5">
        {STEPS.map(({ key, title, sub }, index) => {
          const state: NodeState = index < currentIndex ? 'done' : index === currentIndex ? 'now' : 'pending'
          const isLast = index === STEPS.length - 1
          const stepSub =
            key === 'sign' && signatures ? `${sub} · ${signatures.submitted} of ${signatures.required} signed` : sub
          const showSafenet = key === 'sign' && safenet && phase !== 'locked'

          return (
            <li
              key={key}
              aria-current={state === 'now' ? 'step' : undefined}
              className={cn('relative flex gap-2.5', isLast ? 'pb-2' : 'pb-4')}
            >
              {!isLast && (
                <span
                  className={cn(
                    'absolute top-[18px] -bottom-0.5 left-[7.25px] w-[1.5px]',
                    state === 'done' && !isFlagged ? 'bg-[var(--color-success-light)]' : 'bg-border',
                  )}
                  aria-hidden
                />
              )}
              <span className="pt-px">
                <Bead state={state === 'done' && isFlagged ? 'pending' : state} />
              </span>
              <span className="sr-only min-w-0 min-[1200px]:not-sr-only min-[1200px]:flex min-[1200px]:flex-col">
                <span
                  className={cn(
                    'text-[12.5px] leading-4',
                    state === 'now' && 'font-bold',
                    state === 'pending' && 'text-muted-foreground',
                  )}
                >
                  {title}
                </span>
                <span className="mt-px text-[11px] leading-[15px] text-muted-foreground">{stepSub}</span>
                {showSafenet && (
                  <span
                    data-testid="safenet-rail-note"
                    data-phase={phase}
                    className={cn(
                      'mt-0.5 text-[11px] leading-[15px]',
                      phase === 'risk'
                        ? 'text-[var(--color-error-dark)]'
                        : isRunningPhase(safenet.state.phase)
                          ? 'text-foreground'
                          : phase === 'no-issues'
                            ? 'text-[var(--color-success-dark)]'
                            : 'text-muted-foreground',
                    )}
                  >
                    {getRailSafenetNote(safenet.state, safenet.nowMs)}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

export type SafenetTxRailProps = {
  step: number
  stepCount: number
  txSummary?: Transaction
}

export const SafenetTxRail = ({ step, stepCount, txSummary }: SafenetTxRailProps): ReactElement => {
  const { isCreation, willExecute, onlyExecute } = useContext(TxFlowContext)
  const { scenario } = useSafenetScenario()
  const { safe } = useSafeInfo()
  const check = useSafenetCheckState(resolveRole(scenario.role, { isCreation, willExecute, onlyExecute }))
  const executionInfo = txSummary?.executionInfo
  const submitted = isMultisigExecutionInfo(executionInfo) ? executionInfo.confirmationsSubmitted : 0

  return (
    <SafenetTxRailView
      current={getRailStep({ step, stepCount, willExecute })}
      safenet={check ?? undefined}
      signatures={safe.threshold > 1 ? { submitted, required: safe.threshold } : undefined}
    />
  )
}

export default SafenetTxRail
