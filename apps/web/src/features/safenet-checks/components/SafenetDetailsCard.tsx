import type { CSSProperties, ReactElement, ReactNode } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@safe-global/views/components/ui/accordion'
import { Card } from '@safe-global/views/components/ui/card'
import { Chip } from '@safe-global/views/components/ui/chip'
import DateTime from '@/components/common/DateTime'
import { cn } from '@safe-global/views/utils/cn'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import {
  CheckStatus,
  type PublicCheckStatus,
  type SafenetCheckSnapshot,
} from '@safe-global/utils/features/safenet-checks'
import SafenetLogo from '@/public/images/safenet/safenet-logo.svg'
import accordionCss from '@/components/tx/ColorCodedTxAccordion/styles.module.css'
import { CHIP_VARIANT, STATUS_PRESENTATION } from '../statusPresentation'
import { explainFailure, summariseRejection, type RejectionSummary } from '../summariseRejection'
import { useSafenetDisplayStatus } from '../useSafenetDisplayStatus'
import { useSafenetLinks, type SafenetLinks } from '../useSafenetLinks'
import { Typography } from '@safe-global/views/components/ui/typography'
import { SAFENET_ATTESTATION_LINK_LABEL, SAFENET_EXPLORER_LINK_LABEL, SafenetOutboundLink } from './SafenetLinks'
import { SafenetDetailsPanel, SafenetDetailsPanelStack, SafenetPulse } from './SafenetBlocks'

type VerdictStatus = Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>

export type SafenetDetailsCardViewProps = {
  publicStatus: VerdictStatus
  snapshot: SafenetCheckSnapshot
  safeTxHash: string
  chainId: string
  timestampMs?: number
  /** Still waiting for signatures or execution, so "sign now, execute later" applies. */
  isQueued?: boolean
  defaultExpanded?: boolean
}

// Colour lives in the chip and the blocks; the card itself only turns red on a risk.
const NEUTRAL_BORDER = 'var(--color-border-main)'

/** Meta lines on white/grey — same token as Receipt grid labels in Transaction details. */
const META_TEXT_CLASS = 'text-[var(--color-primary-light)]'
/** Softer than body copy; still readable on paper (lighter than META_TEXT_CLASS in light mode). */
const META_SOFT_TEXT_CLASS = 'text-muted-foreground'

const BodyText = ({ children }: { children: ReactNode }): ReactElement => (
  <Typography variant="paragraph-small" className="text-[var(--color-text-primary)]">
    {children}
  </Typography>
)

const isCheckInFlight = (publicStatus: VerdictStatus): boolean =>
  publicStatus === CheckStatus.SUBMITTED || publicStatus === CheckStatus.IN_PROGRESS

const RISK_ACCENT = {
  '--accordion-border-active': 'var(--color-error-main)',
  '--accordion-fill-active': 'var(--color-error-background)',
} as CSSProperties

const NEUTRAL_ACCENT = {
  '--accordion-border-active': NEUTRAL_BORDER,
  '--accordion-fill-active': 'transparent',
} as CSSProperties

const cardAccent = (publicStatus: VerdictStatus): CSSProperties =>
  publicStatus === CheckStatus.MALICIOUS ? RISK_ACCENT : NEUTRAL_ACCENT

type ProofLink = { href: string; testId: string; label: string }

/** A verified BENIGN links its attestation, any other settled check the explorer, an in-flight one nothing. */
const proofLinkFor = (publicStatus: VerdictStatus, links: SafenetLinks, isInFlight: boolean): ProofLink | null => {
  if (publicStatus === CheckStatus.BENIGN && links.attestationHref) {
    return { href: links.attestationHref, testId: 'safenet-details-attestation', label: SAFENET_ATTESTATION_LINK_LABEL }
  }
  if (isInFlight) return null

  return { href: links.explorerHref, testId: 'safenet-details-explorer', label: SAFENET_EXPLORER_LINK_LABEL }
}

/** Says why a check has no verdict, failed or still in dispute; renders nothing for any other state. */
const FailureReason = ({
  publicStatus,
  snapshot,
}: {
  publicStatus: VerdictStatus
  snapshot: SafenetCheckSnapshot
}): ReactElement | null => {
  if (publicStatus !== CheckStatus.TIMED_OUT && publicStatus !== CheckStatus.DISPUTED) return null

  return (
    <Typography variant="paragraph-small" className={META_TEXT_CLASS} data-testid="safenet-failure-reason">
      {explainFailure(snapshot)}
    </Typography>
  )
}

/** The status sentence; a verified BENIGN also says when its attestation landed. */
const StatusCopy = ({
  publicStatus,
  snapshot,
  attestationHref,
}: {
  publicStatus: VerdictStatus
  snapshot: SafenetCheckSnapshot
  attestationHref: string | null
}): ReactElement => {
  const { copy } = STATUS_PRESENTATION[publicStatus]
  const verifiedAt = snapshot.attestedAtMs
  if (publicStatus !== CheckStatus.BENIGN || attestationHref === null || verifiedAt === null) {
    return <BodyText>{copy}</BodyText>
  }

  return (
    <Typography variant="paragraph-small" className="text-[var(--color-text-primary)]">
      {copy}
      {' · '}
      <span className={META_TEXT_CLASS}>
        Verified <DateTime value={verifiedAt} />
      </span>
    </Typography>
  )
}

/** The PRD sentence for states without cited rules; flagged rules render in FlaggedRuleBlocks. */
const ResultBlock = ({
  publicStatus,
  snapshot,
  summary,
  isQueued,
  attestationHref,
}: {
  publicStatus: VerdictStatus
  snapshot: SafenetCheckSnapshot
  summary: RejectionSummary
  isQueued?: boolean
  attestationHref: string | null
}): ReactElement | null => {
  if (publicStatus === CheckStatus.MALICIOUS && summary.rules.length > 0) return null

  return (
    <div className="flex flex-col gap-1">
      <StatusCopy publicStatus={publicStatus} snapshot={snapshot} attestationHref={attestationHref} />
      <FailureReason publicStatus={publicStatus} snapshot={snapshot} />
      {isCheckInFlight(publicStatus) && isQueued && (
        <Typography variant="paragraph-small" className={META_TEXT_CLASS}>
          You can sign now and come back to execute once the check is done.
        </Typography>
      )}
    </div>
  )
}

/** One block per rule a sentinel cited, like Copilot's threat results. */
const FlaggedRuleBlocks = ({ summary }: { summary: RejectionSummary }): ReactElement | null => {
  if (summary.rules.length === 0) return null

  return (
    <SafenetDetailsPanel>
      <SafenetDetailsPanelStack>
        {summary.rules.map((rule) => (
          <div key={rule.id} className="flex flex-col gap-1">
            <BodyText>{rule.label}</BodyText>
            <BodyText>{rule.description}</BodyText>
            <Typography variant="paragraph-small" className={META_SOFT_TEXT_CLASS}>
              Flagged by {rule.citedBy} {rule.citedBy === 1 ? 'sentinel' : 'sentinels'}
            </Typography>
          </div>
        ))}
      </SafenetDetailsPanelStack>
    </SafenetDetailsPanel>
  )
}

/** Expandable Safenet card for a transaction's details, built like the "Transaction details" block below it. */
export const SafenetDetailsCardView = ({
  publicStatus,
  snapshot,
  safeTxHash,
  chainId,
  isQueued,
  defaultExpanded,
}: SafenetDetailsCardViewProps): ReactElement => {
  const links = useSafenetLinks(publicStatus, snapshot, chainId, safeTxHash)
  const summary = summariseRejection(snapshot.events)
  const isInFlight = isCheckInFlight(publicStatus)
  const proofLink = proofLinkFor(publicStatus, links, isInFlight)

  return (
    <Card
      data-testid="safenet-details-card"
      data-status={publicStatus}
      className={cn(accordionCss.item, 'animate-in fade-in duration-300')}
      style={cardAccent(publicStatus)}
    >
      <Accordion defaultValue={defaultExpanded ? ['safenet'] : []}>
        <AccordionItem value="safenet" className="border-0">
          <AccordionTrigger className={cn(accordionCss.trigger, 'items-center px-4')}>
            <div className="flex w-full flex-row items-center justify-between gap-2">
              <SafenetLogo role="img" aria-label="Safenet check" className="h-3 w-auto text-foreground" />
              <Chip variant={CHIP_VARIANT[publicStatus]}>
                {isInFlight ? (
                  <SafenetPulse size={12} />
                ) : (
                  <SeverityIcon severity={STATUS_PRESENTATION[publicStatus].severity} width={12} height={12} />
                )}
                {STATUS_PRESENTATION[publicStatus].label}
              </Chip>
            </div>
          </AccordionTrigger>

          <AccordionContent className={cn(accordionCss.content, 'p-4')}>
            <div className="flex flex-col gap-3">
              <ResultBlock
                publicStatus={publicStatus}
                snapshot={snapshot}
                summary={summary}
                isQueued={isQueued}
                attestationHref={links.attestationHref}
              />

              {publicStatus === CheckStatus.MALICIOUS && <FlaggedRuleBlocks summary={summary} />}

              {proofLink && (
                <SafenetOutboundLink href={proofLink.href} testId={proofLink.testId}>
                  {proofLink.label}
                </SafenetOutboundLink>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}

export type SafenetDetailsCardProps = {
  safeTxHash: string | undefined
  chainId: string
  timestampMs?: number
  isQueued?: boolean
}

/** Renders nothing until a check has been observed for this transaction. Starts collapsed. */
const SafenetDetailsCard = ({
  safeTxHash,
  chainId,
  timestampMs,
  isQueued,
}: SafenetDetailsCardProps): ReactElement | null => {
  const display = useSafenetDisplayStatus(safeTxHash, timestampMs)
  if (!safeTxHash || !display) return null

  return (
    <SafenetDetailsCardView
      publicStatus={display.publicStatus}
      snapshot={display.snapshot}
      safeTxHash={safeTxHash}
      chainId={chainId}
      timestampMs={timestampMs}
      isQueued={isQueued}
    />
  )
}

export default SafenetDetailsCard
