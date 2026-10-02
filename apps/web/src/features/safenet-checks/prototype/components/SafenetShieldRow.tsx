import { useEffect, type ReactElement } from 'react'
import { LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '@/components/common/ExternalLink'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as HnQueueAssessment)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { useCurrentChain } from '@/hooks/useChains'
import {
  PHASE_PRESENTATION,
  SAFENET_LEARN_MORE_URL,
  SAFENET_NAME,
  getEtaCopy,
  isRunningPhase,
  isVerdictPhase,
} from '../copy'
import { getSafenetExplorerHref } from '../explorer'
import type { SafenetCheckState } from '../types'
import { useFlowSafenetCheck } from '../useFlowSafenetCheck'
import { useSafenetScenario } from '../useSafenetScenario'

export type SafenetShieldRowViewProps = {
  state: SafenetCheckState
  nowMs: number
  explorerHref?: string
  onEnable?: () => void
}

/** Safenet's section in the Safe Shield panel, laid out like the real `SafenetChecksSection`. */
export const SafenetShieldRowView = ({
  state,
  nowMs,
  explorerHref,
  onEnable,
}: SafenetShieldRowViewProps): ReactElement => {
  const { severity, muted, copy } = PHASE_PRESENTATION[state.phase]
  const isRunning = isRunningPhase(state.phase)

  return (
    <div data-testid="safenet-shield-row" data-phase={state.phase} className="p-4">
      <div className="flex items-start gap-2">
        {state.phase === 'locked' ? (
          <LockKeyhole className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <SeverityIcon severity={severity} muted={muted} />
        )}
        <div className="flex flex-1 flex-col gap-1" aria-live="polite">
          <Typography variant="paragraph-small" className="font-bold leading-4" data-testid="safenet-name">
            {SAFENET_NAME}
          </Typography>
          <Typography variant="paragraph-small" className="text-muted-foreground">
            {copy}
            {isRunning && ` ${getEtaCopy(state.etaMs, nowMs)}`}
            {state.phase === 'before-sign' && (
              <>
                {' '}
                <ExternalLink href={SAFENET_LEARN_MORE_URL} data-testid="safenet-learn-more">
                  Learn more
                </ExternalLink>
              </>
            )}
          </Typography>
          {state.riskDetails && (
            <Typography variant="paragraph-small" data-testid="safenet-risk-details">
              {state.riskDetails}
            </Typography>
          )}
          {isVerdictPhase(state.phase) && explorerHref && (
            <Typography variant="paragraph-small">
              <ExternalLink href={explorerHref} data-testid="safenet-explorer-link">
                View on Safenet explorer
              </ExternalLink>
            </Typography>
          )}
        </div>
        {state.phase === 'locked' && onEnable && (
          <Button variant="outline" size="xs" onClick={onEnable}>
            Turn on
          </Button>
        )}
      </div>
    </div>
  )
}

/** Safenet section in the Safe Shield panel. Reports its phase so a risk raises the risk acknowledgement. */
export const SafenetShieldRow = (): ReactElement | null => {
  const { check, safeTxHash } = useFlowSafenetCheck()
  const { updateScenario } = useSafenetScenario()
  const { setSafenetPhase } = useSafeShield()
  const chainId = useCurrentChain()?.chainId
  const phase = check?.state.phase

  useEffect(() => {
    setSafenetPhase(phase)
    return () => setSafenetPhase(undefined)
  }, [phase, setSafenetPhase])

  if (!check) return null

  return (
    <SafenetShieldRowView
      state={check.state}
      nowMs={check.nowMs}
      explorerHref={chainId && safeTxHash ? getSafenetExplorerHref(chainId, safeTxHash) : undefined}
      onEnable={() => updateScenario({ enhancedExecution: true })}
    />
  )
}

export default SafenetShieldRow
