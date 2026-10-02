import type { ReactElement } from 'react'
import { AuditRow, type ActionType } from '@/components/common/AuditLog'
import ExternalLink from '@/components/common/ExternalLink'
import { PHASE_PRESENTATION, isVerdictPhase } from '../copy'
import { getSafenetExplorerHref } from '../explorer'
import type { SafenetCheckPhase, SafenetCheckState } from '../types'
import { useSafenetCheckState } from '../useSafenetCheckState'

const STEP_ICON: Partial<Record<SafenetCheckPhase, ActionType>> = {
  submitted: 'pending',
  checking: 'pending',
  'no-issues': 'confirmed',
  risk: 'expired',
  unavailable: 'expired',
}

export type SafenetHistoryRowViewProps = {
  state: SafenetCheckState
  explorerHref: string
  isLast?: boolean
}

export const SafenetHistoryRowView = ({ state, explorerHref, isLast }: SafenetHistoryRowViewProps): ReactElement => (
  <div data-testid="safenet-history-row" data-phase={state.phase}>
    <AuditRow
      label={`Safenet: ${PHASE_PRESENTATION[state.phase].label.toLowerCase()}`}
      actionType={STEP_ICON[state.phase] ?? 'pending'}
      iconColor={state.phase === 'risk' ? 'var(--color-error-main)' : undefined}
      actor={
        isVerdictPhase(state.phase) ? (
          <>
            Safenet ·{' '}
            <ExternalLink href={explorerHref} data-testid="safenet-explorer-link">
              View on Safenet explorer
            </ExternalLink>
          </>
        ) : (
          'Safenet'
        )
      }
      isLast={isLast}
    />
  </div>
)

export type SafenetHistoryRowProps = {
  safeTxHash: string
  chainId: string
  isExecuted: boolean
  isLast?: boolean
}

/** Safenet step in the transaction audit log, linking to the Safenet explorer once there is a verdict. */
export const SafenetHistoryRow = ({
  safeTxHash,
  chainId,
  isExecuted,
  isLast,
}: SafenetHistoryRowProps): ReactElement | null => {
  const check = useSafenetCheckState(safeTxHash, { isExecuted })
  if (!check || check.state.phase === 'locked') return null

  return (
    <SafenetHistoryRowView
      state={check.state}
      explorerHref={getSafenetExplorerHref(chainId, safeTxHash)}
      isLast={isLast}
    />
  )
}

export default SafenetHistoryRow
