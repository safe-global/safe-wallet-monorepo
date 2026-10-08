import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import DateTime from '@/components/common/DateTime'
import { cn } from '@/utils/cn'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import {
  CheckStatus,
  type PublicCheckStatus,
  type SafenetCheckSnapshot,
} from '@safe-global/utils/features/safenet-checks'
import SafenetLogo from '@/public/images/safenet/safenet-logo.svg'
import accordionCss from '@/components/tx/ColorCodedTxAccordion/styles.module.css'
import { CHIP_LABEL, CHIP_VARIANT, STATUS_PRESENTATION } from '../statusPresentation'
import { summariseRejection, type RejectionSummary } from '../summariseRejection'
import { useSafenetDisplayStatus } from '../useSafenetDisplayStatus'
import { useSafenetLinks } from '../useSafenetLinks'
import { Typography } from '@/components/ui/typography'
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

const Secondary = ({ children }: { children: ReactNode }): ReactElement => (
  <Typography variant="paragraph-small" className="text-[var(--color-text-secondary)]">
    {children}
  </Typography>
)

const BodyText = ({ children }: { children: ReactNode }): ReactElement => (
  <Typography variant="paragraph-small" className="text-[var(--color-text-primary)]">
    {children}
  </Typography>
)

const sentinels = (count: number) => `${count} sentinel${count === 1 ? '' : 's'}`

/**
 * The PRD sentence for states that have no cited rules.
 * A risk with recognised rules renders only in FlaggedRuleBlocks.
 */
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
  const { copy } = STATUS_PRESENTATION[publicStatus]
  const isInFlight = publicStatus === CheckStatus.SUBMITTED || publicStatus === CheckStatus.IN_PROGRESS
  if (publicStatus === CheckStatus.MALICIOUS && summary.rules.length > 0) return null

  return (
    <div className="flex flex-col gap-1">
      <BodyText>{copy}</BodyText>
      {isInFlight && isQueued && (
        <Secondary>You can sign now and come back to execute once the check is done.</Secondary>
      )}
      {publicStatus === CheckStatus.BENIGN && attestationHref && snapshot.attestedAtMs !== null && (
        <Secondary>
          Verified <DateTime value={snapshot.attestedAtMs} />
        </Secondary>
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
            <Typography variant="paragraph-small" className="text-[var(--color-text-secondary)]">
              Flagged by {sentinels(rule.citedBy)}
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
  timestampMs,
  isQueued,
  defaultExpanded,
}: SafenetDetailsCardViewProps): ReactElement => {
  const links = useSafenetLinks(publicStatus, snapshot, chainId, safeTxHash)
  const summary = summariseRejection(snapshot.events)
  const isInFlight = publicStatus === CheckStatus.SUBMITTED || publicStatus === CheckStatus.IN_PROGRESS
  const isMalicious = publicStatus === CheckStatus.MALICIOUS
  const accent = isMalicious ? 'var(--color-error-main)' : NEUTRAL_BORDER
  const openFill = isMalicious ? 'var(--color-error-background)' : 'transparent'
  const proofLink =
    publicStatus === CheckStatus.BENIGN && links.attestationHref
      ? {
          href: links.attestationHref,
          testId: 'safenet-details-attestation',
          label: SAFENET_ATTESTATION_LINK_LABEL,
        }
      : !isInFlight
        ? { href: links.explorerHref, testId: 'safenet-details-explorer', label: SAFENET_EXPLORER_LINK_LABEL }
        : null

  return (
    <Card
      data-testid="safenet-details-card"
      data-status={publicStatus}
      className={cn(accordionCss.item, 'animate-in fade-in duration-300')}
      style={
        {
          '--accordion-border-active': accent,
          '--accordion-fill-active': openFill,
        } as CSSProperties
      }
    >
      {/* Remounts when a risk lands so the card opens even if it was already on screen. */}
      <Accordion key={defaultExpanded ? 'open' : 'closed'} defaultValue={defaultExpanded ? ['safenet'] : []}>
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
                {CHIP_LABEL[publicStatus]}
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
