import { useContext, useState, type ReactElement, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Typography } from '@/components/ui/typography'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as HnQueueAssessment)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
// eslint-disable-next-line no-restricted-imports -- same lazy-chunk reason as SeverityIcon
import { AnalysisGroupCardItem } from '@/features/safe-shield/components/AnalysisGroupCard/AnalysisGroupCardItem'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import type { SafenetCheckView } from '@safe-global/utils/features/safenet-checks/hooks'
import { useFlowSafenetCheck } from '../useFlowSafenetCheck'
import { CheckStatus, type SafenetCheckSnapshot } from '@safe-global/utils/features/safenet-checks'
import { Severity, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import useSafeInfo from '@/hooks/useSafeInfo'
import {
  MULTIPLE_RULES_TITLE,
  PRE_CHECK_COPY,
  resolvePresentation,
  SAFENET_ABOUT,
  SAFENET_BLURB,
  STALE_NOTE,
} from '../statusPresentation'
import { formatFlaggedCount, summariseRejection, type RejectionSummary } from '../summariseRejection'
import { formatTimingSentence } from '../checkTiming'
import { useCheckTiming } from '../useCheckTiming'
import { useSafenetLinks } from '../useSafenetLinks'
import { SafenetLearnMore, SafenetOutboundLink } from './SafenetLinks'

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

/** One gray block with a severity bar, like the other checks' expanded results. */
const Block = ({ severity, children }: { severity?: Severity; children: ReactNode }): ReactElement => (
  <AnalysisGroupCardItem
    severity={severity}
    result={{ severity: severity ?? Severity.INFO, type: ThreatStatus.NO_THREAT, title: '', description: '' }}
    description={children}
  />
)

/** Running check: a pulsing dot in the slot the severity icon takes once there's a result. */
const PulsingIndicator = (): ReactElement => (
  <span
    className="relative flex size-4 shrink-0 items-center justify-center"
    data-testid="safenet-check-pulse"
    aria-hidden
  >
    <span className="absolute inline-flex size-3 animate-ping rounded-full bg-[var(--color-info-main)] opacity-50 motion-reduce:animate-none" />
    <span className="relative inline-flex size-2 rounded-full bg-[var(--color-info-main)]" />
  </span>
)

/** Same collapsible row as the other Copilot checks: icon and "Safenet", then the details on expand. */
const SectionRow = ({
  icon,
  announcement,
  status,
  reason,
  defaultOpen = false,
  children,
}: {
  icon: ReactNode
  /** Read out once per state change; the row itself is not a live region. */
  announcement: string
  status?: string
  reason?: string
  defaultOpen?: boolean
  children: ReactNode
}): ReactElement => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      data-testid="safenet-checks-section"
      data-status={status}
      data-reason={reason}
      className="animate-in fade-in duration-300"
    >
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>

      <CollapsibleTrigger
        nativeButton={false}
        render={<div className="flex cursor-pointer flex-row items-center justify-between gap-2 p-3" />}
      >
        <div className="flex flex-row items-center gap-2">
          {icon}
          <Typography
            variant="paragraph-small"
            className="text-[var(--color-primary-light)]"
            data-testid="safenet-section-label"
          >
            Safenet
          </Typography>
        </div>
        <ChevronDown
          className={`size-4 text-[var(--color-text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>

      <CollapsibleContent keepMounted>
        <div className="flex flex-col gap-2 px-3 pt-1 pb-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

const PreCheck = ({ kind }: { kind: PreCheckKind }): ReactElement => (
  <SectionRow
    icon={<SeverityIcon severity={Severity.INFO} muted width={16} height={16} />}
    announcement="Safenet checks this transaction after you sign"
    status="PRE_CHECK"
    reason={kind}
    defaultOpen
  >
    <Block>
      {SAFENET_ABOUT} {PRE_CHECK_COPY[kind]} <SafenetLearnMore />
    </Block>
  </SectionRow>
)

const RejectionReasons = ({ summary }: { summary: RejectionSummary }): ReactElement => (
  <div className="flex flex-col gap-2" data-testid="safenet-rejection-rules">
    {summary.rules.map((rule) => (
      <Block key={rule.id} severity={Severity.CRITICAL}>
        <span className="font-bold">{rule.label}</span>
        <br />
        {rule.description}
      </Block>
    ))}
  </div>
)

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
  return sentence ? (
    <>
      <br />
      <span data-testid="safenet-check-timing">{sentence}</span>
    </>
  ) : null
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
  const isRisk = publicStatus === CheckStatus.MALICIOUS
  const summary = isRisk && snapshot ? summariseRejection(snapshot.events) : null
  const flaggedCount = summary ? formatFlaggedCount(summary) : null
  const title = summary ? maliciousTitle(summary, content.label) : content.label
  // The title already says the result here, so the block explains Safenet instead of repeating it.
  const showBlurb = publicStatus === CheckStatus.BENIGN || publicStatus === CheckStatus.IN_PROGRESS
  const showsExplorerLink =
    !!safeTxHash && (isRisk || unavailableReason === 'READ_FAILED' || unavailableReason === 'WINDOW_UNCERTAIN')
  const blockSeverity = content.muted ? undefined : content.severity

  return (
    <SectionRow
      // Remounts when a risk lands so the row opens even if it was already on screen.
      key={isRisk ? 'risk' : 'other'}
      icon={
        isInFlight ? (
          <PulsingIndicator />
        ) : (
          <SeverityIcon severity={content.severity} muted={content.muted} width={16} height={16} />
        )
      }
      announcement={`Safenet: ${title}`}
      status={publicStatus}
      reason={unavailableReason}
      defaultOpen={isRisk}
    >
      {summary && summary.rules.length > 1 && (
        <Typography variant="paragraph-small" className="font-bold">
          {title}
        </Typography>
      )}
      {summary && summary.rules.length > 0 ? (
        <RejectionReasons summary={summary} />
      ) : (
        <Block severity={blockSeverity}>
          <span className="font-bold">{title}</span>
          <br />
          {showBlurb ? SAFENET_BLURB : content.copy} <SafenetLearnMore />
          {publicStatus === CheckStatus.IN_PROGRESS && snapshot && (
            <InFlightTiming snapshot={snapshot} submittedAt={submittedAt} />
          )}
          {isStale && isInFlight && (
            <>
              <br />
              {STALE_NOTE}
            </>
          )}
        </Block>
      )}

      {flaggedCount && <Note testId="safenet-flagged-count">{flaggedCount}</Note>}

      {publicStatus === CheckStatus.BENIGN && links.attestationHref && (
        <Block>
          <SafenetOutboundLink href={links.attestationHref} testId="safenet-attestation-link">
            View signed attestation
          </SafenetOutboundLink>
        </Block>
      )}

      {showsExplorerLink && (
        <Block>
          <SafenetOutboundLink href={links.explorerHref} testId="safenet-explorer-link">
            View on Safenet explorer
          </SafenetOutboundLink>
        </Block>
      )}
    </SectionRow>
  )
}

/** Reads once a proposed transaction's submission time is known; a new transaction gets the pre-check note. */
export const SafenetChecksSection = (): ReactElement | null => {
  const { txId, isCreation, isProposing, willExecute, txLayoutProps } = useContext(TxFlowContext)
  const { safe } = useSafeInfo()
  const { safeTxHash, submittedAt, check } = useFlowSafenetCheck()

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
