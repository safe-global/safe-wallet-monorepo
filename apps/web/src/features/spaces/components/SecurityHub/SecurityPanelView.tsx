import { type ReactElement, type ReactNode, useMemo, useState } from 'react'
import { Box, Button, CircularProgress, Collapse, Divider, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded'
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded'
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import Link from 'next/link'
import type { EvidenceItem, ScanContext, ScanResult } from '@/features/security/data/scanners/types'
import type { SecurityGrade } from '@/features/security/data/securityTypes'
import { computeSummary } from '@/features/security/data/scanners/utils'
import { getStrengthLevel, getStrengthColor, type StrengthLevel } from '@/features/security/data/securityScoring'
import { ZERO_ADDRESS } from '@/features/security/data/scanners/constants'
import { CHECK_DEFS } from '@/features/security/data/securityChecks'
import { shortenAddress } from '@safe-global/utils/utils/formatters'

type SecurityPanelViewProps = {
  scanContext: ScanContext | null
  results: Record<string, ScanResult>
  isComplete: boolean
  /** The `shortName:address` param used to deep-link a CTA to the correct Safe (e.g., "eth:0x..."). */
  safeQueryParam?: string
}

const STRENGTH_DESCRIPTIONS: Record<StrengthLevel, string> = {
  Strong: 'Your account is well configured.',
  Moderate: 'Your account has room for improvement.',
  Weak: 'Your account has security gaps that should be addressed.',
  Critical: 'Your account has critical issues that need immediate attention.',
}

const GRADE_BG_BY_STRENGTH: Record<StrengthLevel, string> = {
  Strong: 'success.background',
  Moderate: 'warning.background',
  Weak: 'error.background',
  Critical: 'error.background',
}

// Heuristic for per-module trust display (matches modules scanner name-list)
const KNOWN_MODULE_NAME_FRAGMENTS = [
  'delay',
  'allowance',
  'spending limit',
  'roles',
  'scope guard',
  'bridge',
  'reality',
  'optimistic',
  'exit',
  'connext',
]

const looksLikeKnownModule = (name?: string | null): boolean => {
  if (!name) return false
  const lower = name.toLowerCase()
  return KNOWN_MODULE_NAME_FRAGMENTS.some((known) => lower.includes(known))
}

/**
 * A row is considered "passing" (bucketed into the accordion) when the user has no action to take.
 * `inconclusive` means "we couldn't determine" (e.g. 3rd-party screening API unavailable) — treating
 * it as passing avoids false alarm; the row is still expandable with its distinct grey icon.
 */
const isPassingStatus = (s: ScanResult['status']) => s === 'clear' || s === 'not_applicable' || s === 'inconclusive'

const SEVERITY_RANK: Record<SecurityGrade, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

/** Sort row entries with most severe first, falling back to original order. */
const sortBySeverity = <T extends { severity: SecurityGrade }>(items: T[]): T[] =>
  [...items].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])

// ───────────────────────────────────────────────────────────────────────────────
// Unified row + chip + section primitives

/** Leading icon reflecting a check's status. Sized & colored to match the accordion summary icon. */
const StatusIcon = ({ status }: { status: ScanResult['status'] }): ReactElement => {
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

const Row = ({ leadIcon, title, trailing, expandedContent }: RowProps): ReactElement => {
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

type Cta = { label: string; href: string }

/**
 * Build a navigation CTA for a failing check. Returns null when:
 *  - the row is passing (no action needed),
 *  - we don't yet have a `safeQueryParam` (chain metadata still loading), or
 *  - there's no CHECK_DEFS entry for this check id.
 * Label precedence: `ScanResult.ctaLabelOverride` → `CHECK_DEFS[id].ctaLabel`.
 */
const buildCta = (checkId: string, result: ScanResult | undefined, safeQueryParam: string | undefined): Cta | null => {
  if (!safeQueryParam) return null
  const def = CHECK_DEFS[checkId]
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
const EvidenceList = ({
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
const buildExpanded = (result: ScanResult | undefined, cta?: Cta | null): ReactNode => {
  if (!result) return cta ? <EvidenceList cta={cta} /> : undefined
  const isOk = result.status === 'clear' || result.status === 'not_applicable'
  const intro = !isOk && result.remediation ? result.remediation : undefined
  const hasEvidence = result.evidence && result.evidence.length > 0
  if (!intro && !hasEvidence && !cta) return undefined
  return <EvidenceList intro={intro} evidence={result.evidence} cta={cta} />
}

const MotionBox = motion.create(Box)

/** Stagger delay per row within a section (seconds). */
const ROW_STAGGER = 0.04

const SectionPanel = ({
  title,
  rows,
  footer,
  /** Base delay offset so sections appearing later start their stagger later. */
  baseDelay = 0,
}: {
  title: string
  rows: { key: string; node: ReactNode }[]
  footer?: ReactNode
  baseDelay?: number
}): ReactElement | null => {
  if (rows.length === 0 && !footer) return null
  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, delay: baseDelay }}
      sx={{ mb: 3 }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 700,
          display: 'block',
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Paper
        elevation={0}
        sx={{
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {rows.map((r, idx) => (
          <MotionBox
            key={r.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: baseDelay + (idx + 1) * ROW_STAGGER }}
          >
            {idx > 0 && <Divider />}
            {r.node}
          </MotionBox>
        ))}
        {footer && (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: baseDelay + (rows.length + 1) * ROW_STAGGER }}
          >
            {footer}
          </MotionBox>
        )}
      </Paper>
    </MotionBox>
  )
}

// ───────────────────────────────────────────────────────────────────────────────
// Header

const PanelHeader = ({
  results,
  isComplete,
}: {
  results: Record<string, ScanResult>
  isComplete: boolean
}): ReactElement | null => {
  const summary = useMemo(() => computeSummary(results), [results])

  if (!isComplete && !summary) {
    return <Skeleton variant="rectangular" height={120} sx={{ borderRadius: '12px', mb: 3 }} />
  }
  if (!summary) return null

  const clearRatio = summary.applicableCount > 0 ? summary.passing / summary.applicableCount : 0
  const score = Math.round(clearRatio * 100)
  const level = getStrengthLevel(clearRatio, summary.hasCriticalIssue)
  const color = getStrengthColor(level)
  const failureCount = summary.applicableCount - summary.passing
  const actionLine =
    failureCount === 0
      ? 'All checks passing.'
      : `${failureCount} ${failureCount === 1 ? 'issue' : 'issues'} need attention.`

  return (
    <Paper sx={{ p: 2.5, borderRadius: '12px', mb: 3, backgroundColor: GRADE_BG_BY_STRENGTH[level] }} elevation={0}>
      <Stack direction="row" spacing={2.5} alignItems="center">
        <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
          <CircularProgress variant="determinate" value={100} size={80} thickness={4} sx={{ color: 'border.light' }} />
          <CircularProgress
            variant="determinate"
            value={score}
            size={80}
            thickness={4}
            sx={{
              color,
              position: 'absolute',
              left: 0,
              '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
            }}
          />
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1 }}>
              {score}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={700} mb={0.5}>
            {level}
          </Typography>
          <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.5, mb: 0.5 }}>
            {STRENGTH_DESCRIPTIONS[level]}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {actionLine}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

// ───────────────────────────────────────────────────────────────────────────────
// Signers section

const SignersSection = ({
  scanContext,
  results,
  safeQueryParam,
}: {
  scanContext: ScanContext
  results: Record<string, ScanResult>
  safeQueryParam?: string
}): ReactElement | null => {
  const signerIntegrityResult = results['signer_integrity']
  const multichainResult = results['multichain_setup']

  const [passingExpanded, setPassingExpanded] = useState(false)

  type SectionRow = { key: string; severity: SecurityGrade; isPassing: boolean; node: ReactNode }

  // Bucket per-signer rows into flagged vs screened.
  const signerItems: SectionRow[] = []
  // All signer rows route back to the signer_integrity remediation page.
  const signerCta = buildCta('signer_integrity', signerIntegrityResult, safeQueryParam)
  scanContext.owners.forEach((owner) => {
    const severity: SecurityGrade = signerIntegrityResult?.severity ?? 'Low'
    const status: ScanResult['status'] = signerIntegrityResult?.status ?? 'clear'
    const title = owner.name || shortenAddress(owner.value)

    // Reason string only when there's something noteworthy to explain
    let intro: string | undefined
    if (status === 'inconclusive') {
      intro = 'Screening service unavailable. Manually verify this signer.'
    } else if (severity === 'Critical') {
      intro = 'This address appears on a sanctions or block list. Consider replacing this signer.'
    } else if (status !== 'clear') {
      intro = 'This address has elevated risk exposure (transactions linked to flagged sources).'
    }

    const signerEvidence: EvidenceItem[] = [{ label: 'Address', value: owner.value }]
    const rowCta = isPassingStatus(status) ? null : signerCta

    signerItems.push({
      key: `signer-${owner.value}`,
      severity,
      isPassing: isPassingStatus(status),
      node: (
        <Row
          leadIcon={<StatusIcon status={status} />}
          title={title}
          expandedContent={<EvidenceList intro={intro} evidence={signerEvidence} cta={rowCta} />}
        />
      ),
    })
  })

  // Build the multichain entry (if applicable). When it fails, promote it into the failing-rows
  // bucket so it's ranked alongside flagged signers by severity. When it passes, keep it as its
  // own visible row below the accordion — we don't bucket it under "N signers" since it isn't
  // a signer, just a check about signer alignment across chains.
  let multichainItem: SectionRow | null = null
  if (multichainResult && multichainResult.status !== 'not_applicable') {
    const ok = multichainResult.status === 'clear'
    const title = ok ? 'Signers are consistent across networks' : 'Signers differ across networks'
    const multichainCta = buildCta('multichain_setup', multichainResult, safeQueryParam)
    multichainItem = {
      key: 'multichain',
      severity: multichainResult.severity,
      isPassing: isPassingStatus(multichainResult.status),
      node: (
        <Row
          leadIcon={<StatusIcon status={multichainResult.status} />}
          title={title}
          expandedContent={buildExpanded(multichainResult, multichainCta)}
        />
      ),
    }
  }

  const failingItems = [...signerItems.filter((i) => !i.isPassing)]
  if (multichainItem && !multichainItem.isPassing) failingItems.push(multichainItem)
  const failingRows = sortBySeverity(failingItems).map(({ key, node }) => ({ key, node }))
  const passingSigners = signerItems.filter((i) => i.isPassing).map(({ key, node }) => ({ key, node }))
  const passingMultichainRow =
    multichainItem && multichainItem.isPassing ? { key: multichainItem.key, node: multichainItem.node } : null

  const footer =
    passingSigners.length > 0 || passingMultichainRow ? (
      <>
        {passingSigners.length > 0 && (
          <>
            {failingRows.length > 0 && <Divider />}
            <Box
              onClick={() => setPassingExpanded((v) => !v)}
              sx={{
                px: 2,
                py: 1.25,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            >
              <CheckCircleRoundedIcon sx={{ color: 'success.main', fontSize: 18 }} />
              <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                {passingSigners.length}{' '}
                {passingSigners.length === 1 ? 'signer not blocklisted' : 'signers not blocklisted'}
              </Typography>
              {passingExpanded ? (
                <UnfoldLessRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              ) : (
                <UnfoldMoreRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              )}
            </Box>
            <Collapse in={passingExpanded}>
              {passingSigners.map((r) => (
                <Box key={r.key}>
                  <Divider />
                  {r.node}
                </Box>
              ))}
            </Collapse>
          </>
        )}
        {passingMultichainRow && (
          <>
            {(failingRows.length > 0 || passingSigners.length > 0) && <Divider />}
            {passingMultichainRow.node}
          </>
        )}
      </>
    ) : undefined

  return <SectionPanel title="Your signers" rows={failingRows} footer={footer} baseDelay={0.16} />
}

// ───────────────────────────────────────────────────────────────────────────────
// Security checks section (account setup + activity rolled into one)

const SecurityChecksSection = ({
  scanContext,
  results,
  safeQueryParam,
}: {
  scanContext: ScanContext
  results: Record<string, ScanResult>
  safeQueryParam?: string
}): ReactElement | null => {
  const accountSetupResult = results['account_setup']
  const recoveryResult = results['recovery']
  const versionResult = results['contract_version']
  const factoryResult = results['factory_validation']
  const guardResult = results['guard']
  const fallbackResult = results['fallback_handler']
  const modulesResult = results['modules']
  const pendingResult = results['pending_tx']
  const scanningResult = results['transaction_scanning']

  const hasGuard = scanContext.guard !== null && scanContext.guard.value !== ZERO_ADDRESS
  const hasFallback = scanContext.fallbackHandler !== null && scanContext.fallbackHandler.value !== ZERO_ADDRESS
  const activeModules = (scanContext.modules ?? []).filter((m) => m.value !== ZERO_ADDRESS)

  // Modules collapse: when N > 2, summarize and let user expand
  const [modulesExpanded, setModulesExpanded] = useState(false)
  const showModuleSummary = activeModules.length > 2 && !modulesExpanded

  // Passing checks accordion
  const [passingExpanded, setPassingExpanded] = useState(false)

  type SectionRow = { key: string; severity: SecurityGrade; isPassing: boolean; node: ReactNode }
  const items: SectionRow[] = []

  const iconFor = (r: ScanResult) => <StatusIcon status={r.status} />

  if (accountSetupResult) {
    const ok = isPassingStatus(accountSetupResult.status)
    const title = ok
      ? 'Signing threshold is strong'
      : scanContext.threshold === 1
        ? 'Single signer controls this Safe'
        : 'Signing threshold is low'
    items.push({
      key: 'threshold',
      severity: accountSetupResult.severity,
      isPassing: ok,
      node: (
        <Row
          leadIcon={iconFor(accountSetupResult)}
          title={title}
          expandedContent={buildExpanded(
            accountSetupResult,
            buildCta('account_setup', accountSetupResult, safeQueryParam),
          )}
        />
      ),
    })
  }

  if (recoveryResult) {
    const ok = isPassingStatus(recoveryResult.status)
    const title =
      recoveryResult.status === 'clear'
        ? 'Recovery is configured'
        : recoveryResult.status === 'not_applicable'
          ? 'Recovery not available on this network'
          : 'Recovery is not configured'
    items.push({
      key: 'recovery',
      severity: recoveryResult.severity,
      isPassing: ok,
      node: (
        <Row
          leadIcon={iconFor(recoveryResult)}
          title={title}
          expandedContent={buildExpanded(recoveryResult, buildCta('recovery', recoveryResult, safeQueryParam))}
        />
      ),
    })
  }

  if (versionResult) {
    const ok = isPassingStatus(versionResult.status)
    const title = ok ? 'Contract version is up to date' : 'Contract version is outdated'
    items.push({
      key: 'version',
      severity: versionResult.severity,
      isPassing: ok,
      node: (
        <Row
          leadIcon={iconFor(versionResult)}
          title={title}
          expandedContent={buildExpanded(versionResult, buildCta('contract_version', versionResult, safeQueryParam))}
        />
      ),
    })
  }

  if (factoryResult) {
    const ok = isPassingStatus(factoryResult.status)
    const title = ok ? 'Deployed via official Safe factory' : 'Deployed from an unrecognized source'
    items.push({
      key: 'factory',
      severity: factoryResult.severity,
      isPassing: ok,
      node: (
        <Row
          leadIcon={iconFor(factoryResult)}
          title={title}
          expandedContent={buildExpanded(factoryResult, buildCta('factory_validation', factoryResult, safeQueryParam))}
        />
      ),
    })
  }

  if (guardResult) {
    const ok = isPassingStatus(guardResult.status)
    const title = ok
      ? hasGuard
        ? 'Transaction guard is active'
        : 'No transaction guard in use'
      : hasGuard
        ? 'Transaction guard is unverified'
        : 'Transaction guard is recommended'
    items.push({
      key: 'guard',
      severity: guardResult.severity,
      isPassing: ok,
      node: (
        <Row
          leadIcon={iconFor(guardResult)}
          title={title}
          expandedContent={buildExpanded(guardResult, buildCta('guard', guardResult, safeQueryParam))}
        />
      ),
    })
  }

  if (fallbackResult) {
    const ok = isPassingStatus(fallbackResult.status)
    // Scanner emits a human label like "Official Safe fallback handler" / "CoW Protocol TWAP handler"
    // in evidence — reuse it directly so the title auto-matches each variant.
    const handlerLabel = fallbackResult.evidence?.find(
      (e): e is { label: string; value: string } => typeof e !== 'string' && e.label === 'Status',
    )?.value
    const title = ok
      ? hasFallback
        ? handlerLabel || 'Fallback handler is active'
        : 'No fallback handler in use'
      : 'Fallback handler is unverified'
    items.push({
      key: 'fallback',
      severity: fallbackResult.severity,
      isPassing: ok,
      node: (
        <Row
          leadIcon={iconFor(fallbackResult)}
          title={title}
          expandedContent={buildExpanded(fallbackResult, buildCta('fallback_handler', fallbackResult, safeQueryParam))}
        />
      ),
    })
  }

  if (modulesResult) {
    if (activeModules.length === 0) {
      items.push({
        key: 'modules-empty',
        severity: modulesResult.severity,
        isPassing: isPassingStatus(modulesResult.status),
        node: (
          <Row
            leadIcon={iconFor(modulesResult)}
            title="No modules installed"
            expandedContent={buildExpanded(modulesResult, buildCta('modules', modulesResult, safeQueryParam))}
          />
        ),
      })
    } else if (showModuleSummary) {
      // Collapsed summary row — not expandable, acts as a gateway to per-module rows.
      items.push({
        key: 'modules-summary',
        severity: modulesResult.severity,
        isPassing: isPassingStatus(modulesResult.status),
        node: (
          <Row
            leadIcon={iconFor(modulesResult)}
            title={`Modules & Extensions · ${activeModules.length} installed`}
            trailing={
              <Button
                size="small"
                variant="text"
                onClick={(e) => {
                  e.stopPropagation()
                  setModulesExpanded(true)
                }}
                sx={{ fontSize: '0.7rem', p: 0, minWidth: 0, textTransform: 'none', fontWeight: 600 }}
              >
                View all
              </Button>
            }
          />
        ),
      })
    } else {
      const modulesCta = buildCta('modules', modulesResult, safeQueryParam)
      activeModules.forEach((mod) => {
        const trusted = looksLikeKnownModule(mod.name)
        const severity: SecurityGrade = trusted ? 'Low' : 'High'
        const status: ScanResult['status'] = trusted ? 'clear' : 'issue'
        // Show the module's name as the title for both trusted and unrecognized modules — users
        // need to identify *which* module when it's flagged. The icon + intro convey the verdict.
        const title = mod.name || shortenAddress(mod.value)
        const perModuleEvidence: EvidenceItem[] = [
          { label: 'Address', value: mod.value },
          ...(mod.name ? [{ label: 'Name', value: mod.name }] : []),
        ]
        const intro = trusted
          ? 'Recognized Safe ecosystem module.'
          : "Unrecognized module — not in the known Safe ecosystem deployments. Review carefully and remove if you don't recognize it."
        items.push({
          key: `module-${mod.value}`,
          severity,
          isPassing: trusted,
          node: (
            <Row
              leadIcon={<StatusIcon status={status} />}
              title={title}
              expandedContent={
                <EvidenceList intro={intro} evidence={perModuleEvidence} cta={trusted ? null : modulesCta} />
              }
            />
          ),
        })
      })
    }
  }

  if (scanningResult) {
    const ok = isPassingStatus(scanningResult.status)
    const title = ok ? 'Transaction scanning is enabled' : 'Transaction scanning is disabled'
    items.push({
      key: 'scanning',
      severity: scanningResult.severity,
      isPassing: ok,
      node: (
        <Row
          leadIcon={iconFor(scanningResult)}
          title={title}
          expandedContent={buildExpanded(
            scanningResult,
            buildCta('transaction_scanning', scanningResult, safeQueryParam),
          )}
        />
      ),
    })
  }

  if (pendingResult) {
    const ok = isPassingStatus(pendingResult.status)
    const queued = scanContext.queuedTxCount
    const title = ok
      ? queued > 0
        ? 'Queue is up to date'
        : 'No pending transactions'
      : 'Pending transactions are stale'
    items.push({
      key: 'pending',
      severity: pendingResult.severity,
      isPassing: ok,
      node: (
        <Row
          leadIcon={iconFor(pendingResult)}
          title={title}
          expandedContent={buildExpanded(pendingResult, buildCta('pending_tx', pendingResult, safeQueryParam))}
        />
      ),
    })
  }

  const failingRows = sortBySeverity(items.filter((i) => !i.isPassing)).map(({ key, node }) => ({ key, node }))
  const passingRows = items.filter((i) => i.isPassing).map(({ key, node }) => ({ key, node }))

  const footer =
    passingRows.length > 0 ? (
      <>
        {failingRows.length > 0 && <Divider />}
        <Box
          onClick={() => setPassingExpanded((v) => !v)}
          sx={{
            px: 2,
            py: 1.25,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            '&:hover': { backgroundColor: 'action.hover' },
          }}
        >
          <CheckCircleRoundedIcon sx={{ color: 'success.main', fontSize: 18 }} />
          <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
            {passingRows.length} {passingRows.length === 1 ? 'check passing' : 'checks passing'}
          </Typography>
          {/* UnfoldMore/Less signals a *group* expansion, distinct from the single-row chevron. */}
          {passingExpanded ? (
            <UnfoldLessRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          ) : (
            <UnfoldMoreRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          )}
        </Box>
        <Collapse in={passingExpanded}>
          {passingRows.map((r) => (
            <Box key={r.key}>
              <Divider />
              {r.node}
            </Box>
          ))}
        </Collapse>
      </>
    ) : undefined

  return <SectionPanel title="Security checks" rows={failingRows} footer={footer} baseDelay={0.08} />
}

// ───────────────────────────────────────────────────────────────────────────────
// Top-level

const SecurityPanelView = ({
  scanContext,
  results,
  isComplete,
  safeQueryParam,
}: SecurityPanelViewProps): ReactElement => {
  const hasResults = Object.keys(results).length > 0

  if (!scanContext || (!hasResults && !isComplete)) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: '12px', mb: 3 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '12px', mb: 3 }} />
        <Skeleton variant="rectangular" height={150} sx={{ borderRadius: '12px' }} />
      </Box>
    )
  }

  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <PanelHeader results={results} isComplete={isComplete} />
      </MotionBox>
      <SecurityChecksSection scanContext={scanContext} results={results} safeQueryParam={safeQueryParam} />
      <SignersSection scanContext={scanContext} results={results} safeQueryParam={safeQueryParam} />
    </Box>
  )
}

export default SecurityPanelView
