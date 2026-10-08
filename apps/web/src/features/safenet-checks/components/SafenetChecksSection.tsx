import { useContext, useState, type ReactElement, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import InfoIcon from '@/public/images/notifications/info.svg'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as HnQueueAssessment)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
// eslint-disable-next-line no-restricted-imports -- shared locked row stays inside this lazy feature chunk
import { LockedCheckRow } from '@/features/safe-shield/components/LockedCheckRow'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import type { SafenetCheckView } from '@safe-global/utils/features/safenet-checks/hooks'
import { useFlowSafenetCheck } from '../useFlowSafenetCheck'
import { CheckStatus, type SafenetCheckSnapshot } from '@safe-global/utils/features/safenet-checks'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import useSafeInfo from '@/hooks/useSafeInfo'
import {
  MULTIPLE_RULES_TITLE,
  PRE_CHECK_COPY,
  resolvePresentation,
  SAFENET_ABOUT,
  STALE_NOTE,
} from '../statusPresentation'
import { formatFlaggedCount, summariseRejection, type RejectionSummary } from '../summariseRejection'
import { formatTimingSentence } from '../checkTiming'
import { useCheckTiming } from '../useCheckTiming'
import { useSafenetLinks } from '../useSafenetLinks'
import { SafenetLearnMore, SafenetOutboundLink } from './SafenetLinks'
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

const RejectionReasons = ({ summary }: { summary: RejectionSummary }): ReactElement => (
  <div className="flex flex-col gap-2" data-testid="safenet-rejection-rules">
    {summary.rules.map((rule) => (
      <SafenetBlock key={rule.id} severity={Severity.CRITICAL}>
        <span className="font-bold">{rule.label}</span>
        <br />
        {rule.description}
      </SafenetBlock>
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
  locked = false,
}: SafenetChecksSectionViewProps): ReactElement | null => {
  const { publicStatus, snapshot, unavailableReason, isStale } = check
  const links = useSafenetLinks(publicStatus, snapshot, chainId, safeTxHash ?? '')

  if (locked) {
    return (
      <LockedCheckRow data-testid="safenet-checks-locked" tooltip={<EducationCopy kind={preCheck ?? 'multisig'} />}>
        Safenet check
      </LockedCheckRow>
    )
  }

  if (preCheck) return <PreCheck kind={preCheck} />

  const content = resolvePresentation(publicStatus, unavailableReason, snapshot !== undefined)
  if (!content) return null

  const isInFlight = publicStatus === CheckStatus.SUBMITTED || publicStatus === CheckStatus.IN_PROGRESS
  const isRisk = publicStatus === CheckStatus.MALICIOUS
  const summary = isRisk && snapshot ? summariseRejection(snapshot.events) : null
  const flaggedCount = summary ? formatFlaggedCount(summary) : null
  const title = summary ? maliciousTitle(summary, content.label) : content.label
  const showsExplorerLink =
    !!safeTxHash && (isRisk || unavailableReason === 'READ_FAILED' || unavailableReason === 'WINDOW_UNCERTAIN')
  const blockSeverity = content.muted ? undefined : content.severity

  return (
    <SectionRow
      // Remounts when a risk lands so the row opens even if it was already on screen.
      key={isRisk ? 'risk' : 'other'}
      icon={
        isInFlight ? (
          <SafenetPulse />
        ) : (
          <SeverityIcon severity={content.severity} muted={content.muted} width={16} height={16} />
        )
      }
      announcement={`Safenet: ${title}`}
      status={publicStatus}
      reason={unavailableReason}
      defaultOpen={isRisk}
    >
      <SafenetBlock severity={blockSeverity}>
        <span className="font-bold">{title}</span>
        {publicStatus === CheckStatus.IN_PROGRESS && snapshot && (
          <InFlightTiming snapshot={snapshot} submittedAt={submittedAt} />
        )}
        <br />
        {flaggedCount && summary && summary.rules.length > 0 ? (
          <span data-testid="safenet-flagged-count">{flaggedCount}</span>
        ) : (
          <>
            {content.copy}
            {flaggedCount && (
              <>
                {' '}
                <span data-testid="safenet-flagged-count">{flaggedCount}</span>
              </>
            )}
          </>
        )}
        {isStale && isInFlight && (
          <>
            <br />
            {STALE_NOTE}
          </>
        )}
      </SafenetBlock>

      {summary && summary.rules.length > 0 && <RejectionReasons summary={summary} />}

      {publicStatus === CheckStatus.BENIGN && links.attestationHref && (
        <SafenetBlock>
          <SafenetOutboundLink href={links.attestationHref} testId="safenet-attestation-link">
            View signed attestation
          </SafenetOutboundLink>
        </SafenetBlock>
      )}

      {showsExplorerLink && (
        <SafenetBlock>
          <SafenetOutboundLink href={links.explorerHref} testId="safenet-explorer-link">
            View on Safenet explorer
          </SafenetOutboundLink>
        </SafenetBlock>
      )}
    </SectionRow>
  )
}

/** Reads once a proposed transaction's submission time is known; a new transaction gets the pre-check note. */
export const SafenetChecksSection = ({ locked = false }: { locked?: boolean }): ReactElement | null => {
  const { txId, isCreation, isProposing, willExecute, txLayoutProps } = useContext(TxFlowContext)
  const { safe } = useSafeInfo()
  const { safeTxHash, submittedAt, check } = useFlowSafenetCheck(!locked)

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
      locked={locked}
    />
  )
}

export default SafenetChecksSection
