import { useContext, type ReactElement, type ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '@/components/common/ExternalLink'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as HnQueueAssessment)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
// eslint-disable-next-line no-restricted-imports -- same lazy-chunk reason as SeverityIcon
import { AnalysisGroupCardItem } from '@/features/safe-shield/components/AnalysisGroupCard/AnalysisGroupCardItem'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { getSafeTxHashFromTxId } from '@/utils/transactions'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { useSafenetCheck, type SafenetCheckView } from '@safe-global/utils/features/safenet-checks/hooks'
import { CheckStatus, type SafenetCheckSnapshot } from '@safe-global/utils/features/safenet-checks'
import { Severity, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import useSafeInfo from '@/hooks/useSafeInfo'
import {
  IN_FLIGHT_NOTE,
  MULTIPLE_RULES_TITLE,
  PRE_CHECK_COPY,
  resolvePresentation,
  SAFENET_DOCS_URL,
  STALE_NOTE,
} from '../statusPresentation'
import { formatFlaggedCount, summariseRejection, type RejectionSummary } from '../summariseRejection'
import { formatTimingSentence } from '../checkTiming'
import { useCheckTiming } from '../useCheckTiming'
import { useSafenetLinks } from '../useSafenetLinks'

export type SafenetChecksSectionViewProps = {
  check: Pick<SafenetCheckView, 'publicStatus' | 'snapshot' | 'unavailableReason' | 'isStale'>
  safeTxHash: string | undefined
  chainId: string
  submittedAt?: number
  /** First signer of a new multisig transaction: no check exists until they sign. */
  isPreCheck?: boolean
}

const Note = ({ children, testId }: { children: ReactNode; testId?: string }): ReactElement => (
  <Typography variant="paragraph-small" className="text-muted-foreground" data-testid={testId}>
    {children}
  </Typography>
)

const SectionLayout = ({
  severity,
  muted,
  title,
  status,
  reason,
  children,
}: {
  severity: Severity
  muted: boolean
  title: string
  status?: string
  reason?: string
  children: ReactNode
}): ReactElement => (
  // The section appears only once the chain read resolves; the entrance
  // animation softens the late insert instead of popping it in one frame.
  <div
    data-testid="safenet-checks-section"
    data-status={status}
    data-reason={reason}
    role="status"
    aria-live="polite"
    className="animate-in fade-in slide-in-from-top-1 p-4 duration-300"
  >
    <div className="flex items-start gap-2">
      <SeverityIcon severity={severity} muted={muted} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Typography variant="paragraph-small" className="font-bold leading-4">
          {title}
        </Typography>
        {children}
      </div>
    </div>
  </div>
)

const PreCheck = (): ReactElement => (
  <SectionLayout severity={Severity.INFO} muted title={PRE_CHECK_COPY.label} status="PRE_CHECK">
    <Note>{PRE_CHECK_COPY.copy}</Note>
    <Note>{PRE_CHECK_COPY.waiting}</Note>
    <Note>{PRE_CHECK_COPY.about}</Note>
    <Note>
      <ExternalLink href={SAFENET_DOCS_URL}>What is Safenet?</ExternalLink>
    </Note>
  </SectionLayout>
)

const RejectionReasons = ({ summary }: { summary: RejectionSummary }): ReactElement | null => {
  if (summary.rules.length === 1) return <Note>{summary.rules[0].description}</Note>
  if (summary.rules.length === 0) return null

  return (
    <div className="mt-1 flex flex-col gap-2" data-testid="safenet-rejection-rules">
      {summary.rules.map((rule) => (
        <AnalysisGroupCardItem
          key={rule.id}
          severity={Severity.CRITICAL}
          result={{
            severity: Severity.CRITICAL,
            type: ThreatStatus.MALICIOUS,
            title: rule.label,
            description: rule.description,
          }}
          description={
            <>
              <span className="font-bold">{rule.label}</span>
              <br />
              {rule.description}
            </>
          }
        />
      ))}
    </div>
  )
}

const maliciousTitle = (summary: RejectionSummary, fallback: string): string => {
  if (summary.rules.length === 1) return summary.rules[0].label
  if (summary.rules.length > 1) return MULTIPLE_RULES_TITLE
  return fallback
}

const InFlightTiming = ({
  snapshot,
  submittedAt,
}: {
  snapshot: SafenetCheckSnapshot
  submittedAt?: number
}): ReactElement | null => {
  const sentence = formatTimingSentence(useCheckTiming(snapshot, submittedAt))
  return sentence ? <Note testId="safenet-check-timing">{sentence}</Note> : null
}

/** Safenet section in the Safe Shield widget, rendered from builders in stories and tests. */
export const SafenetChecksSectionView = ({
  check,
  safeTxHash,
  chainId,
  submittedAt,
  isPreCheck = false,
}: SafenetChecksSectionViewProps): ReactElement | null => {
  const { publicStatus, snapshot, unavailableReason, isStale } = check
  const links = useSafenetLinks(publicStatus, snapshot, chainId, safeTxHash ?? '')

  if (isPreCheck) return <PreCheck />

  const content = resolvePresentation(publicStatus, unavailableReason, snapshot !== undefined)
  if (!content) return null

  const isInFlight = publicStatus === CheckStatus.SUBMITTED || publicStatus === CheckStatus.IN_PROGRESS
  const summary = publicStatus === CheckStatus.MALICIOUS && snapshot ? summariseRejection(snapshot.events) : null
  const flaggedCount = summary ? formatFlaggedCount(summary) : null
  const showsExplorerLink =
    !!safeTxHash &&
    (publicStatus === CheckStatus.MALICIOUS ||
      unavailableReason === 'READ_FAILED' ||
      unavailableReason === 'WINDOW_UNCERTAIN')

  return (
    <SectionLayout
      severity={content.severity}
      muted={content.muted}
      title={summary ? maliciousTitle(summary, content.label) : content.label}
      status={publicStatus}
      reason={unavailableReason}
    >
      {summary && summary.rules.length > 0 ? <RejectionReasons summary={summary} /> : <Note>{content.copy}</Note>}

      {isInFlight && snapshot && (
        <>
          {publicStatus === CheckStatus.IN_PROGRESS && <InFlightTiming snapshot={snapshot} submittedAt={submittedAt} />}
          <Note>{IN_FLIGHT_NOTE}</Note>
        </>
      )}

      {flaggedCount && <Note testId="safenet-flagged-count">{flaggedCount}</Note>}

      {isStale && isInFlight && <Note>{STALE_NOTE}</Note>}

      {publicStatus === CheckStatus.BENIGN && links.attestationHref && (
        <Note>
          <ExternalLink data-testid="safenet-attestation-link" href={links.attestationHref}>
            View attestation
          </ExternalLink>
        </Note>
      )}

      {showsExplorerLink && (
        <Note>
          <ExternalLink data-testid="safenet-explorer-link" href={links.explorerHref}>
            View on Safenet explorer
          </ExternalLink>
        </Note>
      )}
    </SectionLayout>
  )
}

/** Reads once a proposed transaction's submission time is known; a new multisig transaction gets the pre-check note. */
export const SafenetChecksSection = (): ReactElement | null => {
  const { txId, txDetails, isCreation, isProposing, willExecute, txLayoutProps } = useContext(TxFlowContext)
  const safeTxHash = txId ? getSafeTxHashFromTxId(txId) : undefined
  const submittedAt =
    txDetails && isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)
      ? txDetails.detailedExecutionInfo.submittedAt
      : undefined

  const { safe, safeAddress } = useSafeInfo()
  const check = useSafenetCheck(submittedAt !== undefined ? safeTxHash : undefined, submittedAt, {
    chainId: safe.chainId,
    safeAddress,
  })

  const isPreCheck =
    !txId && !!isCreation && !isProposing && !willExecute && !txLayoutProps?.isMessage && safe.threshold > 1

  return (
    <SafenetChecksSectionView
      check={check}
      safeTxHash={safeTxHash}
      chainId={safe.chainId}
      submittedAt={submittedAt}
      isPreCheck={isPreCheck}
    />
  )
}

export default SafenetChecksSection
