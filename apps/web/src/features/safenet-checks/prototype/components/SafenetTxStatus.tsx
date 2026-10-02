import type { ReactElement } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '@/components/common/ExternalLink'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as HnQueueAssessment)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import {
  PHASE_PRESENTATION,
  SAFENET_DETAILS_LINK,
  SAFENET_DETAILS_LINK_LABEL,
  SAFENET_NAME,
  getEtaCopy,
  isRunningPhase,
  isVerdictPhase,
} from '../copy'
import { getSafenetExplorerHref } from '../explorer'
import type { SafenetCheckState } from '../types'
import { useSafenetCheckState } from '../useSafenetCheckState'

export type SafenetTxStatusViewProps = {
  state: SafenetCheckState
  nowMs: number
  explorerHref: string
}

/** Safenet result in an expanded queued transaction, laid out like `HnQueueAssessmentBanner`. */
export const SafenetTxStatusView = ({ state, nowMs, explorerHref }: SafenetTxStatusViewProps): ReactElement => {
  const { severity, muted, label } = PHASE_PRESENTATION[state.phase]
  const isRisk = state.phase === 'risk'

  return (
    <Alert variant={isRisk ? 'destructive' : 'default'} data-testid="safenet-tx-status" data-phase={state.phase}>
      <SeverityIcon severity={severity} muted={muted} width={20} height={20} />
      <AlertDescription>
        <div className="flex flex-col gap-2">
          <Typography variant="paragraph-small">
            <strong>{SAFENET_NAME}:</strong> {label}
            {isRunningPhase(state.phase) && `. ${getEtaCopy(state.etaMs, nowMs)}`}
          </Typography>
          {state.riskDetails && <Typography variant="paragraph-small">{state.riskDetails}</Typography>}
          {isVerdictPhase(state.phase) && (
            <ExternalLink
              href={explorerHref}
              aria-label={SAFENET_DETAILS_LINK_LABEL}
              className="inline-flex self-start"
              data-testid="safenet-explorer-link"
            >
              <Typography variant="paragraph-small-bold">{SAFENET_DETAILS_LINK}</Typography>
            </ExternalLink>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

export type SafenetTxStatusProps = {
  safeTxHash: string
  chainId: string
}

export const SafenetTxStatus = ({ safeTxHash, chainId }: SafenetTxStatusProps): ReactElement | null => {
  const check = useSafenetCheckState(safeTxHash)
  if (!check || check.state.phase === 'locked' || check.state.phase === 'before-sign') return null

  return (
    <SafenetTxStatusView
      state={check.state}
      nowMs={check.nowMs}
      explorerHref={getSafenetExplorerHref(chainId, safeTxHash)}
    />
  )
}

export default SafenetTxStatus
