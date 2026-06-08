import { type ReactElement, type ReactNode, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { isAddress } from 'ethers'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { cn } from '@/utils/cn'
import { Typography } from '@/components/ui/typography'
import CopyButton from '@/components/common/CopyButton'
import type { EvidenceItem, ScanResult, SecurityGrade } from '@/features/security/types'
import { SEVERITY_RANK, type SecurityContract } from '@/features/security'
import { resolveStatusTone, SeverityIcon, type SeverityTone } from '../SeverityIcon/SeverityIcon'

/** Map a SeverityTone's MUI color token (e.g. 'error.main') to its generated CSS var. */
const toneToCssVar = (color: string): string => `var(--color-${color.replace('.', '-')})`

export type SectionRow = { key: string; severity: SecurityGrade; isPassing: boolean; node: ReactNode }

/** A CTA is either a navigation link (`href`) or an in-app action (`onClick`, e.g. open a tx flow). */
export type Cta = { label: string } & ({ href: string } | { onClick: () => void })

/**
 * A row is considered "passing" (bucketed into the accordion) when the user has no action to take.
 * `inconclusive` means "we couldn't determine" (e.g. 3rd-party screening API unavailable) — treating
 * it as passing avoids false alarm; the row is still expandable with its distinct grey icon.
 */
export const isPassingStatus = (s: ScanResult['status']) =>
  s === 'clear' || s === 'not_applicable' || s === 'inconclusive'

/** Sort row entries with most severe first, falling back to original order. */
export const sortBySeverity = <T extends { severity: SecurityGrade }>(items: T[]): T[] =>
  [...items].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])

/**
 * Leading icon reflecting a check's status. Sized & colored to match the accordion summary icon.
 * A Critical-severity issue escalates to the "dangerous" glyph (see `resolveStatusTone`).
 */
export const StatusIcon = ({
  status,
  severity,
}: {
  status: ScanResult['status']
  severity?: SecurityGrade
}): ReactElement => <SeverityIcon tone={resolveStatusTone(status, severity)} />

type RowProps = {
  /** Leading status icon (same visual weight as accordion summary icon) */
  leadIcon?: ReactNode
  title: string
  /** Secondary line under the title (e.g. the check's remediation summary). */
  subtitle?: ReactNode
  /** Severity tone driving the leading accent bar color; omit to hide the bar. */
  accentTone?: SeverityTone
  /** Trailing action node (used by modules summary's "View N" button) */
  trailing?: ReactNode
  /** Reveal additional content on click */
  expandedContent?: ReactNode
}

export const Row = ({ leadIcon, title, subtitle, accentTone, trailing, expandedContent }: RowProps): ReactElement => {
  const [expanded, setExpanded] = useState(false)
  const expandable = !!expandedContent || !!subtitle

  return (
    <div
      className={cn('px-5 py-2', expandable ? 'cursor-pointer hover:bg-muted/60' : 'cursor-default')}
      onClick={expandable ? () => setExpanded((v) => !v) : undefined}
    >
      <div className="flex items-center gap-2.5 py-2.5">
        {accentTone && (
          <div
            className="w-1 shrink-0 self-stretch rounded-full"
            style={{ backgroundColor: toneToCssVar(accentTone.color) }}
          />
        )}
        {leadIcon && <div className="flex shrink-0 items-center">{leadIcon}</div>}
        <Typography variant="paragraph-small" className="min-w-0 flex-1 truncate" title={title}>
          {title}
        </Typography>
        {trailing}
        {expandable && (
          <ChevronDown
            className={cn(
              'h-[18px] w-[18px] shrink-0 text-muted-foreground transition-transform',
              expanded && 'rotate-180',
            )}
          />
        )}
      </div>
      {expandable && (
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Align expanded body's left edge with the title (icon 18px + gap 2.5 → pl-7). */}
              <div
                className={cn('flex flex-col gap-1.5 py-3 px-5 rounded-md bg-muted my-2')}
                onClick={(e) => e.stopPropagation()}
              >
                {subtitle && (
                  <Typography variant="paragraph-mini" color="muted" className="block leading-normal">
                    {subtitle}
                  </Typography>
                )}
                {typeof expandedContent === 'string' ? (
                  <Typography variant="paragraph-mini" color="muted" className="block leading-normal">
                    {expandedContent}
                  </Typography>
                ) : (
                  expandedContent
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

/**
 * Factory that binds `checkDefs` to a CTA builder. Consumers obtain `checkDefs`
 * via useLoadFeature and pass it once; the returned function is then used at
 * each render site.
 *
 * The returned CTA builder returns null when:
 *  - the row is passing (no action needed),
 *  - we don't yet have a `safeQueryParam` (chain metadata still loading), or
 *  - there's no checkDefs entry for this check id.
 * Label precedence: `ScanResult.ctaLabelOverride` → `checkDefs[id].ctaLabel`.
 */
export const makeBuildCta =
  (checkDefs: SecurityContract['checkDefs']) =>
  (checkId: string, result: ScanResult | undefined, safeQueryParam: string | undefined): Cta | null => {
    if (!safeQueryParam) return null
    const def = checkDefs[checkId]
    if (!def) return null
    if (result && isPassingStatus(result.status)) return null
    const label = result?.ctaLabelOverride || def.ctaLabel
    return { label, href: `${def.fixRoute}?safe=${encodeURIComponent(safeQueryParam)}` }
  }

const ctaClassName =
  'group inline-flex items-center gap-1.5 self-start rounded text-primary no-underline transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'

const CtaBody = ({ label }: { label: string }): ReactElement => (
  <>
    <Typography variant="paragraph-mini" className="font-bold leading-normal text-inherit group-hover:underline">
      {label}
    </Typography>
    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
  </>
)

const CtaLink = ({ cta }: { cta: Cta }): ReactElement =>
  'href' in cta ? (
    <Link href={cta.href} onClick={(e) => e.stopPropagation()} className={ctaClassName}>
      <CtaBody label={cta.label} />
    </Link>
  ) : (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        cta.onClick()
      }}
      className={ctaClassName}
    >
      <CtaBody label={cta.label} />
    </button>
  )

/** Expanded-row body: optional intro paragraph + evidence key/value list + optional CTA. */
export const EvidenceList = ({
  intro,
  evidence,
  cta,
}: {
  intro?: string
  evidence?: EvidenceItem[]
  cta?: Cta | null
}): ReactElement | null => {
  const hasEvidence = !!evidence && evidence.length > 0
  if (!intro && !hasEvidence && !cta) return null
  return (
    <div className="flex flex-col gap-1.5">
      {intro && (
        <Typography variant="paragraph-mini" className="block leading-normal">
          {intro}
        </Typography>
      )}
      {hasEvidence && (
        <div className="flex flex-col gap-0.5">
          {evidence!.map((item, idx) =>
            typeof item === 'string' ? (
              <Typography key={idx} variant="paragraph-mini" color="muted" className="block leading-normal break-words">
                {item}
              </Typography>
            ) : (
              <div key={idx} className="flex items-baseline gap-2">
                <Typography variant="paragraph-mini" color="muted" className="w-24 shrink-0 leading-normal">
                  {item.label}
                </Typography>
                {isAddress(item.value) ? (
                  <span className="flex items-center gap-1">
                    <Typography variant="paragraph-mini" className="leading-normal">
                      {shortenAddress(item.value)}
                    </Typography>
                    <CopyButton text={item.value} className="!p-0.5 text-muted-foreground [&_svg]:!size-3" />
                  </span>
                ) : (
                  <Typography variant="paragraph-mini" className="leading-normal break-words">
                    {item.value}
                  </Typography>
                )}
              </div>
            ),
          )}
        </div>
      )}
      {cta && <CtaLink cta={cta} />}
    </div>
  )
}

/**
 * Build expanded body for a row backed by a ScanResult. Returns undefined when there's nothing to show.
 * The remediation summary is surfaced in the row's subtitle (see `Row`), so the expanded body
 * carries only the evidence list and CTA.
 */
export const buildExpanded = (result: ScanResult | undefined, cta?: Cta | null): ReactNode => {
  if (!result) return cta ? <EvidenceList cta={cta} /> : undefined
  const hasEvidence = result.evidence && result.evidence.length > 0
  if (!hasEvidence && !cta) return undefined
  return <EvidenceList evidence={result.evidence} cta={cta} />
}
