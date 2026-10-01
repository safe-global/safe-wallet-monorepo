import { useContext, useEffect, useRef, useState, type ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { isRunningPhase } from '../copy'
import type { SafenetCheckState } from '../types'
import { resolveRole, useSafenetCheckState } from '../useSafenetCheckState'
import { useSafenetScenario } from '../useSafenetScenario'
import { SafenetStatusBody } from './SafenetStatusBody'

export type SafenetExecuteStatusViewProps = {
  state: SafenetCheckState
  nowMs: number
  isWaiting?: boolean
  onWait?: () => void
}

export const SafenetExecuteStatusView = ({
  state,
  nowMs,
  isWaiting = false,
  onWait,
}: SafenetExecuteStatusViewProps): ReactElement => {
  const statusRef = useRef<HTMLDivElement>(null)
  const isRunning = isRunningPhase(state.phase)

  // Waiting means the signer asked to hear about the verdict, so take them to it when it lands.
  useEffect(() => {
    if (isWaiting && !isRunning) statusRef.current?.focus()
  }, [isWaiting, isRunning])

  return (
    <div data-testid="safenet-execute-status" className="mt-4 rounded-lg border border-border p-4">
      <SafenetStatusBody state={state} nowMs={nowMs} title="Safenet check" statusRef={statusRef}>
        {isRunning &&
          (isWaiting ? (
            <Typography variant="paragraph-mini" color="muted">
              Waiting for the result. You can still execute now.
            </Typography>
          ) : (
            onWait && (
              <Button variant="outline" size="xs" className="self-start" onClick={onWait}>
                Wait for result
              </Button>
            )
          ))}
      </SafenetStatusBody>
    </div>
  )
}

/** Safenet status at the execute step. Advisory: "Wait for result" never disables Execute. */
export const SafenetExecuteStatus = (): ReactElement | null => {
  const { isCreation, willExecute, onlyExecute } = useContext(TxFlowContext)
  const { scenario, startedAtMs } = useSafenetScenario()
  const check = useSafenetCheckState(resolveRole(scenario.role, { isCreation, willExecute, onlyExecute }))
  const [waitingFor, setWaitingFor] = useState<number>()

  if (!check || !willExecute || check.state.phase === 'locked') return null

  return (
    <SafenetExecuteStatusView
      state={check.state}
      nowMs={check.nowMs}
      isWaiting={waitingFor === startedAtMs}
      onWait={() => setWaitingFor(startedAtMs)}
    />
  )
}

export default SafenetExecuteStatus
