import { useContext, type ReactElement, type ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { Progress } from '@/components/ui/progress'
import { Link } from '@/components/ui/link'
import { ArrowUpRight } from 'lucide-react'
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
import SafenetLogo from '@/public/images/safenet/safenet-logo.svg'
import {
  MULTIPLE_RULES_TITLE,
  PRE_CHECK_COPY,
  resolvePresentation,
  SAFENET_ABOUT,
  SAFENET_DOCS_URL,
  STALE_NOTE,
} from '../statusPresentation'
import { formatFlaggedCount, summariseRejection, type RejectionSummary } from '../summariseRejection'
import { formatTimingSentence, getCheckProgress } from '../checkTiming'
import { useCheckTiming } from '../useCheckTiming'
import { useSafenetLinks } from '../useSafenetLinks'

export type SafenetChecksSectionViewProps = {
  check: Pick<SafenetCheckView, 'publicStatus' | 'snapshot' | 'unavailableReason' | 'isStale'>
  safeTxHash: string | undefined
  chainId: string
  submittedAt?: number
  /** A new transaction, before any check exists. `executeNow`: it executes in the same click as the signature. */
  preCheck?: PreCheckKind
}

export type PreCheckKind = 'multisig' | 'single' | 'executeNow'

const Note = ({ children, testId }: { children: ReactNode; testId?: string }): ReactElement => (
  <Typography variant="paragraph-small" className="text-muted-foreground" data-testid={testId}>
    {children}
  </Typography>
)

const LearnMore = (): ReactElement => (
  <Link
    variant="muted"
    href={SAFENET_DOCS_URL}
    target="_blank"
    rel="noreferrer noopener"
    className="underline decoration-muted-foreground/40"
    data-testid="safenet-about-link"
  >
    <span className="inline-flex items-center gap-0.5">
      Learn more
      <ArrowUpRight className="size-3.5" aria-hidden />
    </span>
  </Link>
)

const SectionShell = ({
  status,
  reason,
  children,
}: {
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
    className="animate-in fade-in slide-in-from-top-1 flex flex-col gap-3 p-4 duration-300"
  >
    <SafenetLogo role="img" aria-label="Safenet" className="h-3.5 w-auto self-start text-foreground" />
    {children}
  </div>
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
  <SectionShell status={status} reason={reason}>
    <div className="flex items-start gap-2">
      <SeverityIcon severity={severity} muted={muted} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Typography variant="paragraph-small" className="font-bold leading-4">
          {title}
        </Typography>
        {children}
        <Note>
          <LearnMore />
        </Note>
      </div>
    </div>
  </SectionShell>
)

const PreCheck = ({ kind }: { kind: PreCheckKind }): ReactElement => (
  <SectionShell status="PRE_CHECK" reason={kind}>
    <Note>
      {SAFENET_ABOUT} {PRE_CHECK_COPY[kind]} <LearnMore />
    </Note>
  </SectionShell>
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
  const progress = getCheckProgress(snapshot)

  return (
    <>
      {progress !== null && (
        <Progress
          value={progress}
          aria-label="Safenet check progress"
          className="my-1"
          data-testid="safenet-check-progress"
        />
      )}
      {sentence && <Note testId="safenet-check-timing">{sentence}</Note>}
    </>
  )
}

/** Safenet section in the Safe Shield widget, rendered from builders in stories and tests. */
export const SafenetChecksSectionView = ({
  check,
  safeTxHash,
  chainId,
  submittedAt,
  preCheck,
}: SafenetChecksSectionViewProps): ReactElement | null => {
  const { publicStatus, snapshot, unavailableReason, isStale } = check
  const links = useSafenetLinks(publicStatus, snapshot, chainId, safeTxHash ?? '')

  if (preCheck) return <PreCheck kind={preCheck} />

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

      {publicStatus === CheckStatus.IN_PROGRESS && snapshot && (
        <InFlightTiming snapshot={snapshot} submittedAt={submittedAt} />
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

/** Reads once a proposed transaction's submission time is known; a new transaction gets the pre-check note. */
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

  const isNewTransaction = !txId && !!isCreation && !isProposing && !txLayoutProps?.isMessage
  const preCheck: PreCheckKind | undefined = !isNewTransaction
    ? undefined
    : willExecute
      ? 'executeNow'
      : safe.threshold > 1
        ? 'multisig'
        : 'single'

  return (
    <SafenetChecksSectionView
      check={check}
      safeTxHash={safeTxHash}
      chainId={safe.chainId}
      submittedAt={submittedAt}
      preCheck={preCheck}
    />
  )
}

export default SafenetChecksSection
