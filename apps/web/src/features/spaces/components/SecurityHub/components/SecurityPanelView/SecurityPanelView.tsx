import { type ReactElement, type ReactNode, useMemo, useState } from 'react'
import { Box, CircularProgress, Collapse, Divider, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded'
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded'
import type { EvidenceItem, ScanContext, ScanResult, SecurityGrade, StrengthLevel } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import {
  EvidenceList,
  Row,
  StatusIcon,
  buildExpanded,
  isPassingStatus,
  makeBuildCta,
  sortBySeverity,
  type SectionRow,
} from './primitives'
import { useSecurityChecks } from './useSecurityChecks'

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
  const security = useLoadFeature(SecurityFeature)
  const summary = useMemo(() => (security.$isReady ? security.computeSummary(results) : null), [results, security])

  if (!security.$isReady || (!isComplete && !summary)) {
    return <Skeleton variant="rectangular" height={120} sx={{ borderRadius: '12px', mb: 3 }} />
  }
  if (!summary) return null

  const clearRatio = summary.applicableCount > 0 ? summary.passing / summary.applicableCount : 0
  const score = Math.round(clearRatio * 100)
  const level = security.getStrengthLevel(clearRatio, summary.hasCriticalIssue)
  const color = security.getStrengthColor(level)
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
  const security = useLoadFeature(SecurityFeature)
  const buildCta = useMemo(
    () => (security.$isReady ? makeBuildCta(security.checkDefs) : null),
    [security.$isReady, security.checkDefs],
  )

  const signerIntegrityResult = results['signer_integrity']
  const multichainResult = results['multichain_setup']

  const [passingExpanded, setPassingExpanded] = useState(false)

  if (!security.$isReady || !buildCta) return null

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
  const { isReady, failingRows, passingRows } = useSecurityChecks(scanContext, results, safeQueryParam)
  const [passingExpanded, setPassingExpanded] = useState(false)

  // Feature not yet loaded — render nothing; the panel skeleton covers this state.
  if (!isReady) return null

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
