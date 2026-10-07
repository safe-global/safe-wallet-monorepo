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
import {
  CHIP_LABEL,
  CHIP_VARIANT,
  MULTIPLE_RULES_TITLE,
  SAFENET_BLURB,
  STATUS_PRESENTATION,
} from '../statusPresentation'
import { SAFENET_RULE_IDS, SAFENET_RULES, type SafenetRuleId } from '../rejectionRules'
import { summariseRejection, type RejectionSummary } from '../summariseRejection'
import { formatTimingSentence } from '../checkTiming'
import { useCheckTiming } from '../useCheckTiming'
import { useSafenetDisplayStatus } from '../useSafenetDisplayStatus'
import { useSafenetLinks } from '../useSafenetLinks'
import { SafenetLearnMore, SafenetOutboundLink } from './SafenetLinks'
import { SafenetBlock, SafenetPulse } from './SafenetBlocks'

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

const Muted = ({ children }: { children: ReactNode }): ReactElement => (
  <span className="text-[var(--color-text-secondary)]">{children}</span>
)

const sentinels = (count: number) => `${count} sentinel${count === 1 ? '' : 's'}`

/** What each rule's row says: flagged rules name how many sentinels cited them; the rest depend on the verdict. */
const ruleOutcome = (
  id: SafenetRuleId,
  status: VerdictStatus,
  summary: RejectionSummary,
): { severity: Severity; muted: boolean; note: string } => {
  const cited = summary.rules.find((rule) => rule.id === id)
  if (cited) {
    const severity = status === CheckStatus.MALICIOUS ? Severity.CRITICAL : Severity.WARN
    return { severity, muted: false, note: `Flagged by ${sentinels(cited.citedBy)}` }
  }
  if (status === CheckStatus.BENIGN || status === CheckStatus.MALICIOUS) {
    return { severity: Severity.OK, muted: true, note: 'Not detected' }
  }
  if (status === CheckStatus.TIMED_OUT) return { severity: Severity.INFO, muted: true, note: 'No result' }
  return { severity: Severity.INFO, muted: true, note: 'Checking' }
}

const sentinelSentence = (status: VerdictStatus, summary: RejectionSummary): string | null => {
  const { revealed, flagged } = summary
  if (revealed === 0) return null
  if (status === CheckStatus.BENIGN) return `${revealed - flagged} of ${sentinels(revealed)} approved this transaction.`
  return `${flagged} of ${sentinels(revealed)} flagged this transaction.`
}

/** The result first: what Safenet concluded, or how long is left while it runs. */
const ResultBlock = ({
  publicStatus,
  snapshot,
  summary,
  timestampMs,
  isQueued,
  attestationHref,
}: {
  publicStatus: VerdictStatus
  snapshot: SafenetCheckSnapshot
  summary: RejectionSummary
  timestampMs?: number
  isQueued?: boolean
  attestationHref: string | null
}): ReactElement => {
  const timing = formatTimingSentence(useCheckTiming(snapshot, timestampMs))
  const { severity, label, copy } = STATUS_PRESENTATION[publicStatus]
  const isInFlight = publicStatus === CheckStatus.SUBMITTED || publicStatus === CheckStatus.IN_PROGRESS
  const title = publicStatus === CheckStatus.MALICIOUS && summary.rules.length > 1 ? MULTIPLE_RULES_TITLE : label
  // The title already says the result here, so the body explains Safenet instead of repeating it.
  const showBlurb = publicStatus === CheckStatus.BENIGN || publicStatus === CheckStatus.IN_PROGRESS

  return (
    <SafenetBlock severity={severity}>
      <span className="font-bold">{title}</span>
      {isInFlight && timing && (
        <>
          <br />
          <Muted>{timing}</Muted>
        </>
      )}
      <br />
      {showBlurb ? SAFENET_BLURB : copy} <SafenetLearnMore />
      {isInFlight && isQueued && (
        <>
          <br />
          <Muted>You can sign now and come back to execute once the check is done.</Muted>
        </>
      )}
      {publicStatus === CheckStatus.BENIGN && attestationHref && snapshot.attestedAtMs !== null && (
        <>
          <br />
          <Muted>
            Verified <DateTime value={snapshot.attestedAtMs} />
          </Muted>
        </>
      )}
    </SafenetBlock>
  )
}

/** One block per rule a sentinel cited, like Copilot's threat results. */
const FlaggedRuleBlocks = ({
  status,
  summary,
}: {
  status: VerdictStatus
  summary: RejectionSummary
}): ReactElement | null => {
  if (summary.rules.length === 0) return null
  const severity = status === CheckStatus.MALICIOUS ? Severity.CRITICAL : Severity.WARN

  return (
    <>
      {summary.rules.map((rule) => (
        <SafenetBlock key={rule.id} severity={severity}>
          <span className="font-bold">{rule.label}</span>
          <br />
          {rule.description}
          <br />
          <Muted>Flagged by {sentinels(rule.citedBy)}</Muted>
        </SafenetBlock>
      ))}
    </>
  )
}

/** All six rules with their outcome, and who checked them. */
const ChecksBlock = ({ status, summary }: { status: VerdictStatus; summary: RejectionSummary }): ReactElement => {
  const isInFlight = status === CheckStatus.SUBMITTED || status === CheckStatus.IN_PROGRESS
  const sentinelLine = sentinelSentence(status, summary)

  return (
    <SafenetBlock>
      <span className="flex flex-col gap-2">
        <span className="font-bold">{isInFlight ? 'What Safenet checks' : 'What Safenet checked'}</span>
        <ul className="flex flex-col gap-1.5" data-testid="safenet-details-rules">
          {SAFENET_RULE_IDS.map((id) => {
            const outcome = ruleOutcome(id, status, summary)
            return (
              <li key={id} className="flex items-center gap-2" data-rule={id} data-outcome={outcome.note}>
                <SeverityIcon severity={outcome.severity} muted={outcome.muted} width={14} height={14} />
                <span className="min-w-0 flex-1 truncate">{SAFENET_RULES[id].label}</span>
                <Muted>{outcome.note}</Muted>
              </li>
            )
          })}
        </ul>
        {summary.unrecognised && (
          <Muted>A sentinel also cited a reason this version of the app doesn&apos;t recognize.</Muted>
        )}
        {sentinelLine && <Muted>{sentinelLine}</Muted>}
      </span>
    </SafenetBlock>
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
  const accent = publicStatus === CheckStatus.MALICIOUS ? 'var(--color-error-main)' : NEUTRAL_BORDER

  return (
    <Card
      data-testid="safenet-details-card"
      data-status={publicStatus}
      className={cn(accordionCss.item, 'animate-in fade-in duration-300')}
      style={
        {
          '--accordion-border-active': accent,
          '--accordion-fill-active': 'transparent',
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
            <div className="flex flex-col gap-2">
              <ResultBlock
                publicStatus={publicStatus}
                snapshot={snapshot}
                summary={summary}
                timestampMs={timestampMs}
                isQueued={isQueued}
                attestationHref={links.attestationHref}
              />

              <FlaggedRuleBlocks status={publicStatus} summary={summary} />

              <ChecksBlock status={publicStatus} summary={summary} />

              {(links.attestationHref || !isInFlight) && (
                <SafenetBlock>
                  <span className="flex flex-wrap gap-x-4 gap-y-1">
                    {links.attestationHref && (
                      <SafenetOutboundLink testId="safenet-details-attestation" href={links.attestationHref}>
                        View signed attestation
                      </SafenetOutboundLink>
                    )}
                    {!isInFlight && (
                      <SafenetOutboundLink testId="safenet-details-explorer" href={links.explorerHref}>
                        View on Safenet explorer
                      </SafenetOutboundLink>
                    )}
                  </span>
                </SafenetBlock>
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

/** Renders nothing until a check has been observed for this transaction. Opens by itself on a risk. */
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
      defaultExpanded={display.publicStatus === CheckStatus.MALICIOUS}
    />
  )
}

export default SafenetDetailsCard
