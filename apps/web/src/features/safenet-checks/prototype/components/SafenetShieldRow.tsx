import { useContext, useEffect, type ReactElement } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Typography } from '@/components/ui/typography'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as HnQueueAssessment)
import { LockedCheckRow } from '@/features/safe-shield/components/LockedCheckRow'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import {
  PHASE_PRESENTATION,
  SAFENET_EXPLAINER_COPY,
  SAFENET_EXPLAINER_TITLE,
  SAFENET_LOCKED_LABEL,
  SAFENET_ROW_TITLE,
  isVerdictPhase,
} from '../copy'
import type { SafenetCheckState } from '../types'
import { resolveRole, useSafenetCheckState } from '../useSafenetCheckState'
import { useSafenetScenario } from '../useSafenetScenario'
import { SafenetStatusBody } from './SafenetStatusBody'

export type SafenetShieldRowViewProps = {
  state: SafenetCheckState
  nowMs: number
  onEnable?: () => void
  defaultExplainerOpen?: boolean
}

export const SafenetShieldRowView = ({
  state,
  nowMs,
  onEnable,
  defaultExplainerOpen = false,
}: SafenetShieldRowViewProps): ReactElement => {
  if (state.phase === 'locked') {
    return (
      <LockedCheckRow
        data-testid="safenet-shield-row"
        tooltip={PHASE_PRESENTATION.locked.copy}
        action={
          onEnable && (
            <Button variant="outline" size="xs" onClick={onEnable}>
              Turn on
            </Button>
          )
        }
      >
        {SAFENET_LOCKED_LABEL}
      </LockedCheckRow>
    )
  }

  return (
    <div data-testid="safenet-shield-row" className="p-4">
      <SafenetStatusBody state={state} nowMs={nowMs} title={SAFENET_ROW_TITLE}>
        {!isVerdictPhase(state.phase) && state.phase !== 'unavailable' && (
          <Collapsible defaultOpen={defaultExplainerOpen}>
            <CollapsibleTrigger
              render={<Button variant="ghost-muted" size="xs" className="group/explainer -ml-2 self-start" />}
            >
              {SAFENET_EXPLAINER_TITLE}
              <ChevronDown className="transition-transform group-data-[panel-open]/explainer:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Typography variant="paragraph-small" color="muted">
                {SAFENET_EXPLAINER_COPY}
              </Typography>
            </CollapsibleContent>
          </Collapsible>
        )}
      </SafenetStatusBody>
    </div>
  )
}

/** Safenet check row in the Safe Shield panel. A risk result raises the shared risk acknowledgement. */
export const SafenetShieldRow = (): ReactElement | null => {
  const { isCreation, willExecute, onlyExecute } = useContext(TxFlowContext)
  const { scenario, updateScenario } = useSafenetScenario()
  const { setHasSafenetRisk } = useSafeShield()
  const check = useSafenetCheckState(resolveRole(scenario.role, { isCreation, willExecute, onlyExecute }))
  const isRisk = check?.state.phase === 'risk'

  useEffect(() => {
    setHasSafenetRisk(isRisk)
    return () => setHasSafenetRisk(false)
  }, [isRisk, setHasSafenetRisk])

  if (!check) return null

  return (
    <SafenetShieldRowView
      state={check.state}
      nowMs={check.nowMs}
      onEnable={() => updateScenario({ enhancedExecution: true })}
    />
  )
}

export default SafenetShieldRow
