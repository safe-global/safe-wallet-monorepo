import { useContext, useEffect, useRef, useState, type ReactElement } from 'react'
import { CircleAlert, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { cn } from '@/utils/cn'
import { getCardCaption, isRunningPhase, type SafenetFlowStep } from '../copy'
import type { SafenetCheckState } from '../types'
import { resolveRole, useSafenetCheckState } from '../useSafenetCheckState'
import { useSafenetScenario } from '../useSafenetScenario'

export type SafenetCardCaptionViewProps = {
  state: SafenetCheckState
  step: SafenetFlowStep
  isWaiting?: boolean
  onWait?: () => void
}

/** Safenet note just above a tx card's buttons. Advisory: waiting never disables the primary action. */
export const SafenetCardCaptionView = ({
  state,
  step,
  isWaiting = false,
  onWait,
}: SafenetCardCaptionViewProps): ReactElement => {
  const captionRef = useRef<HTMLDivElement>(null)
  const isRunning = isRunningPhase(state.phase)
  const { text, isRisk } = getCardCaption(state.phase, step, isWaiting)
  const Icon = isRisk ? CircleAlert : Info

  // Waiting means the signer asked to hear about the verdict, so take them to it when it lands.
  useEffect(() => {
    if (isWaiting && !isRunning) captionRef.current?.focus()
  }, [isWaiting, isRunning])

  return (
    <div
      ref={captionRef}
      tabIndex={-1}
      data-testid="safenet-card-caption"
      data-phase={state.phase}
      className={cn(
        'mt-4 flex items-center gap-2 rounded-md text-xs leading-4 outline-none',
        isRisk
          ? 'border border-[var(--color-error-light)] bg-[var(--color-error-background)] px-3 py-2 text-[var(--color-error-dark)]'
          : 'text-muted-foreground',
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="flex-1" aria-live="polite">
        {text}
      </span>
      {isRunning && step !== 'review' && !isWaiting && onWait && (
        <Button variant="ghost-muted" size="xs" onClick={onWait}>
          Wait for result
        </Button>
      )}
    </div>
  )
}

/** Safenet note above the buttons of the review, sign or execute card. */
export const SafenetCardCaption = ({ step }: { step: SafenetFlowStep }): ReactElement | null => {
  const { isCreation, willExecute, onlyExecute } = useContext(TxFlowContext)
  const { scenario, startedAtMs } = useSafenetScenario()
  const check = useSafenetCheckState(resolveRole(scenario.role, { isCreation, willExecute, onlyExecute }))
  const [waitingFor, setWaitingFor] = useState<number>()

  if (!check) return null

  return (
    <SafenetCardCaptionView
      state={check.state}
      step={step}
      isWaiting={waitingFor === startedAtMs}
      onWait={() => setWaitingFor(startedAtMs)}
    />
  )
}

export default SafenetCardCaption
