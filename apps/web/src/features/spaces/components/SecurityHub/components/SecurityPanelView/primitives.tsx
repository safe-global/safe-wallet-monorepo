import { type ReactElement, type ReactNode, useState } from 'react'
import { Box, Collapse, Stack, Typography } from '@mui/material'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import Link from 'next/link'
import type { EvidenceItem, ScanResult, SecurityGrade } from '@/features/security/types'
import { SEVERITY_RANK, type SecurityContract } from '@/features/security'

export type SectionRow = { key: string; severity: SecurityGrade; isPassing: boolean; node: ReactNode }

export type Cta = { label: string; href: string }

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

/** Leading icon reflecting a check's status. Sized & colored to match the accordion summary icon. */
export const StatusIcon = ({ status }: { status: ScanResult['status'] }): ReactElement => {
  const sx = { fontSize: 18, flexShrink: 0 } as const
  if (status === 'clear') return <CheckCircleOutlineRoundedIcon sx={{ ...sx, color: 'success.main' }} />
  if (status === 'not_applicable') return <RemoveCircleOutlineRoundedIcon sx={{ ...sx, color: 'text.secondary' }} />
  if (status === 'inconclusive') return <HelpOutlineRoundedIcon sx={{ ...sx, color: 'text.disabled' }} />
  if (status === 'partial') return <WarningAmberRoundedIcon sx={{ ...sx, color: 'warning.main' }} />
  // issue
  return <ErrorOutlineRoundedIcon sx={{ ...sx, color: 'error.main' }} />
}

type RowProps = {
  /** Leading status icon (same visual weight as accordion summary icon) */
  leadIcon?: ReactNode
  title: string
  /** Trailing action node (used by modules summary's "View N" button) */
  trailing?: ReactNode
  /** Reveal additional content on click */
  expandedContent?: ReactNode
}

export const Row = ({ leadIcon, title, trailing, expandedContent }: RowProps): ReactElement => {
  const [expanded, setExpanded] = useState(false)
  const expandable = !!expandedContent

  return (
    <Box
      sx={{
        px: 2,
        cursor: expandable ? 'pointer' : 'default',
        '&:hover': expandable ? { backgroundColor: 'action.hover' } : {},
      }}
      onClick={expandable ? () => setExpanded((v) => !v) : undefined}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 1.25 }}>
        {leadIcon && <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{leadIcon}</Box>}
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
          noWrap
          title={title}
        >
          {title}
        </Typography>
        {trailing}
        {expandable && (
          <KeyboardArrowDownRoundedIcon
            sx={{
              color: 'text.secondary',
              fontSize: 18,
              flexShrink: 0,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        )}
      </Stack>
      {expandable && (
        <Collapse in={expanded}>
          {/* Align expanded body's left edge with the title (icon 18px + gap 1.25 = 3.5 spacing units). */}
          <Box sx={{ pb: 1.5, pl: leadIcon ? 3.5 : 0 }} onClick={(e) => e.stopPropagation()}>
            {typeof expandedContent === 'string' ? (
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
                {expandedContent}
              </Typography>
            ) : (
              expandedContent
            )}
          </Box>
        </Collapse>
      )}
    </Box>
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

const CtaLink = ({ cta }: { cta: Cta }): ReactElement => (
  <Link
    href={cta.href}
    onClick={(e) => e.stopPropagation()}
    style={{ textDecoration: 'none', alignSelf: 'flex-start', borderRadius: 4 }}
    className="security-cta-link"
  >
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      sx={{
        color: 'primary.main',
        cursor: 'pointer',
        transition: 'color 0.15s',
        '& .cta-icon': { transition: 'transform 0.15s' },
        '&:hover': { color: 'primary.dark' },
        '&:hover .cta-label': { textDecoration: 'underline' },
        '&:hover .cta-icon': { transform: 'translateX(2px)' },
        '.security-cta-link:focus-visible &': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
          borderRadius: 4,
        },
      }}
    >
      <Typography className="cta-label" variant="caption" fontWeight={700} sx={{ color: 'inherit', lineHeight: 1.5 }}>
        {cta.label}
      </Typography>
      <ArrowForwardRoundedIcon className="cta-icon" sx={{ fontSize: 14, color: 'inherit' }} />
    </Stack>
  </Link>
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
    <Stack spacing={0.75}>
      {intro && (
        <Typography variant="caption" color="text.primary" sx={{ lineHeight: 1.5, display: 'block' }}>
          {intro}
        </Typography>
      )}
      {hasEvidence && (
        <Stack spacing={0.25}>
          {evidence!.map((item, idx) =>
            typeof item === 'string' ? (
              <Typography
                key={idx}
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1.5, display: 'block', wordBreak: 'break-word' }}
              >
                {item}
              </Typography>
            ) : (
              <Stack key={idx} direction="row" spacing={1} alignItems="baseline">
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 96, flexShrink: 0, lineHeight: 1.5 }}
                >
                  {item.label}
                </Typography>
                <Typography variant="caption" color="text.primary" sx={{ lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {item.value}
                </Typography>
              </Stack>
            ),
          )}
        </Stack>
      )}
      {cta && <CtaLink cta={cta} />}
    </Stack>
  )
}

/** Build expanded body for a row backed by a ScanResult. Returns undefined when there's nothing to show. */
export const buildExpanded = (result: ScanResult | undefined, cta?: Cta | null): ReactNode => {
  if (!result) return cta ? <EvidenceList cta={cta} /> : undefined
  const intro = !isPassingStatus(result.status) && result.remediation ? result.remediation : undefined
  const hasEvidence = result.evidence && result.evidence.length > 0
  if (!intro && !hasEvidence && !cta) return undefined
  return <EvidenceList intro={intro} evidence={result.evidence} cta={cta} />
}
