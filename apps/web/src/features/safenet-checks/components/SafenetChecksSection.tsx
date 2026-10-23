import { useContext, useState, type ReactElement, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import InfoIcon from '@safe-global/views/assets/images/notifications/info.svg'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as HnQueueAssessment)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import { LockedCheckRow } from '@safe-global/views/features/safe-shield/components/LockedCheckRow'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import type { SafenetCheckView } from '@safe-global/utils/features/safenet-checks/hooks'
import { useFlowSafenetCheck } from '../useFlowSafenetCheck'
import { CheckStatus, type PublicCheckStatus, type UnavailableReason } from '@safe-global/utils/features/safenet-checks'
import type { Severity } from '@safe-global/utils/features/safe-shield/types'
import useSafeInfo from '@/hooks/useSafeInfo'
import {
  MULTIPLE_RULES_TITLE,
  PRE_CHECK_COPY,
  resolvePresentation,
  SAFENET_ABOUT,
  STALE_NOTE,
  type ResolvedPresentation,
} from '../statusPresentation'
import { formatFlaggedCount, rejectionSeverity, summariseRejection, type RejectionSummary } from '../summariseRejection'
import { useSafenetLinks, type SafenetLinks } from '../useSafenetLinks'
import {
  SAFENET_ATTESTATION_LINK_LABEL,
  SAFENET_EXPLORER_LINK_LABEL,
  SafenetLearnMore,
  SafenetOutboundLink,
} from './SafenetLinks'
import { SafenetBlock, SafenetPulse } from './SafenetBlocks'

export type SafenetChecksSectionViewProps = {
  check: Pick<SafenetCheckView, 'publicStatus' | 'snapshot' | 'unavailableReason' | 'isStale'>
  safeTxHash: string | undefined
  chainId: string
  submittedAt?: number
  /** A new transaction, before any check exists. `executeNow`: it executes in the same click as the signature. */
  preCheck?: PreCheckKind
  locked?: boolean
}

export type PreCheckKind = 'multisig' | 'single' | 'executeNow'

const EducationCopy = ({ kind }: { kind?: PreCheckKind }): ReactElement => (
  <>
    {SAFENET_ABOUT} {kind && PRE_CHECK_COPY[kind]} <SafenetLearnMore />
  </>
)

const EducationTooltip = ({ kind }: { kind?: PreCheckKind }): ReactElement => (
  <Tooltip>
    <TooltipTrigger render={<span className="inline-flex" tabIndex={0} />} aria-label="About Safenet">
      <InfoIcon className="size-4 text-[var(--color-border-main)]" />
    </TooltipTrigger>
    <TooltipContent className="text-center">
      <EducationCopy kind={kind} />
    </TooltipContent>
  </Tooltip>
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

      <div className="relative flex items-center gap-2 p-3">
        <CollapsibleTrigger aria-label="Safenet" className="absolute inset-0 cursor-pointer" />
        <span className="pointer-events-none inline-flex">{icon}</span>
        <Typography
          variant="paragraph-small"
          className="pointer-events-none text-[var(--color-primary-light)]"
          data-testid="safenet-section-label"
        >
          Safenet
        </Typography>
        <span className="relative inline-flex items-center">
          <EducationTooltip />
        </span>
        <ChevronDown
          aria-hidden
          className={`pointer-events-none ml-auto size-4 text-[var(--color-text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      <CollapsibleContent keepMounted>
        <div className="flex flex-col gap-2 px-3 pt-1 pb-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

const PreCheck = ({ kind }: { kind: PreCheckKind }): ReactElement => (
  <div
    data-testid="safenet-checks-section"
    data-status="PRE_CHECK"
    data-reason={kind}
    className="flex items-center gap-2 p-3"
  >
    <span role="status" aria-live="polite" className="sr-only">
      Safenet checks this transaction after you sign
    </span>
    <Typography
      variant="paragraph-small"
      className="text-[var(--color-primary-light)]"
      data-testid="safenet-section-label"
    >
      Safenet
    </Typography>
    <EducationTooltip kind={kind} />
  </div>
)

/** One card for a risk: each cited rule's label and description, then the sentinel tally. */
const RuleBlock = ({ summary, severity }: { summary: RejectionSummary; severity: Severity }): ReactElement => {
  const flaggedCount = formatFlaggedCount(summary)

  return (
    <SafenetBlock severity={severity}>
      <span className="flex flex-col gap-2" data-testid="safenet-rejection-rules">
        {summary.rules.map((rule) => (
          <span key={rule.id}>
            <span className="font-bold">{rule.label}</span>
            <br />
            {rule.description}
          </span>
        ))}
        {flaggedCount && <span data-testid="safenet-flagged-count">{flaggedCount}</span>}
      </span>
    </SafenetBlock>
  )
}

const maliciousTitle = (summary: RejectionSummary, fallback: string): string => {
  if (summary.rules.length === 1) return summary.rules[0].label
  if (summary.rules.length > 1) return MULTIPLE_RULES_TITLE
  return fallback
}

const isCheckInFlight = (publicStatus: PublicCheckStatus): boolean =>
  publicStatus === CheckStatus.SUBMITTED || publicStatus === CheckStatus.IN_PROGRESS

type SectionCheck = SafenetChecksSectionViewProps['check']

type ProofLink = { href: string; testId: string; label: string }

const EXPLORER_UNAVAILABLE_REASONS: ReadonlyArray<UnavailableReason | undefined> = ['READ_FAILED', 'WINDOW_UNCERTAIN']

/** A risk, an open dispute or an unreadable check points at the explorer once there is a transaction to look up. */
const hasExplorerPage = ({ publicStatus, unavailableReason }: SectionCheck, safeTxHash: string | undefined): boolean =>
  !!safeTxHash &&
  (publicStatus === CheckStatus.MALICIOUS ||
    publicStatus === CheckStatus.DISPUTED ||
    EXPLORER_UNAVAILABLE_REASONS.includes(unavailableReason))

/** A verified BENIGN links its attestation; the explorer page is the fallback where it applies. */
const proofLinkFor = (check: SectionCheck, safeTxHash: string | undefined, links: SafenetLinks): ProofLink | null => {
  if (check.publicStatus === CheckStatus.BENIGN && links.attestationHref) {
    return { href: links.attestationHref, testId: 'safenet-attestation-link', label: SAFENET_ATTESTATION_LINK_LABEL }
  }
  if (!hasExplorerPage(check, safeTxHash)) return null

  return { href: links.explorerHref, testId: 'safenet-explorer-link', label: SAFENET_EXPLORER_LINK_LABEL }
}

const RowIcon = ({ content, isInFlight }: { content: ResolvedPresentation; isInFlight: boolean }): ReactElement =>
  isInFlight ? (
    <SafenetPulse />
  ) : (
    <SeverityIcon severity={content.severity} muted={content.muted} width={16} height={16} />
  )

/** A running check names its state, and says when that state predates a failed refetch. */
const InFlightCopy = ({ copy, isStale }: { copy: string; isStale: boolean }): ReactElement => (
  <>
    <span className="font-bold">{copy}</span>
    {isStale && (
      <>
        <br />
        {STALE_NOTE}
      </>
    )}
  </>
)

/** The headline, the state copy, then the sentinel tally when sentinels voted. */
const VerdictCopy = ({
  title,
  copy,
  summary,
}: {
  title: string
  copy: string
  summary: RejectionSummary | null
}): ReactElement => {
  const flaggedCount = summary ? formatFlaggedCount(summary) : null

  return (
    <>
      <span className="font-bold">{title}</span>
      <br />
      {copy}
      {flaggedCount && (
        <>
          {' '}
          <span data-testid="safenet-flagged-count">{flaggedCount}</span>
        </>
      )}
    </>
  )
}

const CheckBlock = ({
  content,
  title,
  summary,
  isInFlight,
  isStale,
}: {
  content: ResolvedPresentation
  title: string
  summary: RejectionSummary | null
  isInFlight: boolean
  isStale: boolean
}): ReactElement => (
  <SafenetBlock severity={content.muted ? undefined : content.severity}>
    {isInFlight ? (
      <InFlightCopy copy={content.copy} isStale={isStale} />
    ) : (
      <VerdictCopy title={title} copy={content.copy} summary={summary} />
    )}
  </SafenetBlock>
)

type RiskView = { summary: RejectionSummary | null; content: ResolvedPresentation; title: string }

/** A risk takes its title and severity from the rules sentinels cited; other states keep their own. */
const resolveRisk = (check: SectionCheck, content: ResolvedPresentation): RiskView => {
  const summary =
    check.publicStatus === CheckStatus.MALICIOUS && check.snapshot ? summariseRejection(check.snapshot.events) : null
  if (!summary) return { summary, content, title: content.label }

  return {
    summary,
    content: { ...content, severity: rejectionSeverity(summary) },
    title: maliciousTitle(summary, content.label),
  }
}

/** The row once a check has something to show: a running state, a verdict, or a non-verdict "unavailable". */
const CheckRow = ({
  check,
  safeTxHash,
  links,
}: {
  check: SectionCheck
  safeTxHash: string | undefined
  links: SafenetLinks
}): ReactElement | null => {
  const { publicStatus, snapshot, unavailableReason, isStale } = check
  const content = resolvePresentation(publicStatus, unavailableReason, snapshot !== undefined)
  if (!content) return null

  const isInFlight = isCheckInFlight(publicStatus)
  const isRisk = publicStatus === CheckStatus.MALICIOUS
  const risk = resolveRisk(check, content)
  const proofLink = proofLinkFor(check, safeTxHash, links)

  return (
    <SectionRow
      // Remounts when a risk lands so the row opens even if it was already on screen.
      key={isRisk ? 'risk' : 'other'}
      icon={<RowIcon content={risk.content} isInFlight={isInFlight} />}
      announcement={`Safenet: ${risk.title}`}
      status={publicStatus}
      reason={unavailableReason}
      defaultOpen={isRisk}
    >
      {risk.summary && risk.summary.rules.length > 0 ? (
        <RuleBlock summary={risk.summary} severity={risk.content.severity} />
      ) : (
        <CheckBlock
          content={risk.content}
          title={risk.title}
          summary={risk.summary}
          isInFlight={isInFlight}
          isStale={isStale}
        />
      )}

      {proofLink && (
        <SafenetOutboundLink href={proofLink.href} testId={proofLink.testId} className="text-sm">
          {proofLink.label}
        </SafenetOutboundLink>
      )}
    </SectionRow>
  )
}

/** Safenet section in the Safe Shield widget, rendered from builders in stories and tests. */
export const SafenetChecksSectionView = ({
  check,
  safeTxHash,
  chainId,
  preCheck,
  locked = false,
}: SafenetChecksSectionViewProps): ReactElement | null => {
  const links = useSafenetLinks(check.publicStatus, check.snapshot, chainId, safeTxHash ?? '')

  if (locked) {
    return (
      <LockedCheckRow data-testid="safenet-checks-locked" tooltip={<EducationCopy kind={preCheck ?? 'multisig'} />}>
        Safenet check
      </LockedCheckRow>
    )
  }

  if (preCheck) return <PreCheck kind={preCheck} />

  return <CheckRow check={check} safeTxHash={safeTxHash} links={links} />
}

/** A new transaction gets the note for how it will be signed, or the one for signing and executing in a single click. */
const resolvePreCheck = (
  isNewTransaction: boolean,
  willExecute: boolean,
  threshold: number,
): PreCheckKind | undefined => {
  if (!isNewTransaction) return undefined
  if (willExecute) return 'executeNow'

  return threshold > 1 ? 'multisig' : 'single'
}

/** Reads once a proposed transaction's submission time is known; a new transaction gets the pre-check note. */
export const SafenetChecksSection = ({ locked = false }: { locked?: boolean }): ReactElement | null => {
  const { txId, isCreation, isProposing, willExecute, txLayoutProps } = useContext(TxFlowContext)
  const { safe } = useSafeInfo()
  const { safeTxHash, submittedAt, check } = useFlowSafenetCheck(!locked)

  const isNewTransaction = !txId && !!isCreation && !isProposing && !txLayoutProps?.isMessage
  const preCheck = resolvePreCheck(isNewTransaction, willExecute, safe.threshold)

  return (
    <SafenetChecksSectionView
      check={check}
      safeTxHash={safeTxHash}
      chainId={safe.chainId}
      submittedAt={submittedAt}
      preCheck={preCheck}
      locked={locked}
    />
  )
}

export default SafenetChecksSection
