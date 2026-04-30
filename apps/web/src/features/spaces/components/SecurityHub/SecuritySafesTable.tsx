import { type ReactElement, useState, useCallback, useEffect, useMemo, useRef, Fragment, forwardRef } from 'react'
import {
  Box,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import type { SpaceSafeEntry, SelectedSafe } from './index'
import type { ScanResult, GradeSummary, SafeGrade } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import type { SecurityContract } from '@/features/security'
import Identicon from '@/components/common/Identicon'
import ChainIndicator from '@/components/common/ChainIndicator'
import { NetworkLogosList } from '@/features/multichain'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { AppRoutes } from '@/config/routes'

const DASH = '—'

// motion-enabled elements for table animations
const MotionTableRow = motion.create(
  forwardRef<HTMLTableRowElement, React.ComponentProps<typeof TableRow>>(function MotionTableRowInner(props, ref) {
    return <TableRow ref={ref} {...props} />
  }),
)
const MotionTbody = motion.create('tbody')

const ROW_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

type ScoreCellProps = {
  summary: GradeSummary | null
  isScanning?: boolean
  getStrengthLevel: SecurityContract['getStrengthLevel']
  getStrengthColor: SecurityContract['getStrengthColor']
}

const ScoreCell = ({ summary, isScanning, getStrengthLevel, getStrengthColor }: ScoreCellProps) => {
  if (!summary) {
    if (isScanning) return <Skeleton variant="rounded" width={60} height={20} />
    return (
      <Typography variant="body2" color="text.secondary">
        {DASH}
      </Typography>
    )
  }
  const clearRatio = summary.applicableCount > 0 ? summary.passing / summary.applicableCount : 0
  const score = Math.round(clearRatio * 100)
  const level = getStrengthLevel(clearRatio, summary.hasCriticalIssue)
  const color = getStrengthColor(level)

  return (
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <Typography variant="body2" fontWeight={600}>
        {score}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        / 100
      </Typography>
    </Stack>
  )
}

/** Extract a specific evidence label's value from a ScanResult. */
const getEvidence = (
  results: Record<string, ScanResult> | undefined,
  scannerId: string,
  label: string,
): string | null => {
  const evidence = results?.[scannerId]?.evidence
  if (!evidence) return null
  for (const item of evidence) {
    if (typeof item !== 'string' && item.label === label) return item.value
  }
  return null
}

const ThresholdCell = ({ results, isScanning }: { results?: Record<string, ScanResult>; isScanning?: boolean }) => {
  if (!results && isScanning) return <Skeleton variant="rounded" width={50} height={20} />
  const threshold = getEvidence(results, 'account_setup', 'Threshold')
  return (
    <Typography variant="body2" color="text.primary">
      {threshold ?? DASH}
    </Typography>
  )
}

const VersionCell = ({ results, isScanning }: { results?: Record<string, ScanResult>; isScanning?: boolean }) => {
  if (!results && isScanning) return <Skeleton variant="rounded" width={50} height={20} />
  const version = getEvidence(results, 'contract_version', 'Current version')
  return (
    <Typography variant="body2" color="text.primary">
      {version ?? DASH}
    </Typography>
  )
}

const formatBalance = (fiatTotal?: string | null): string => {
  const value = Number(fiatTotal)
  if (!fiatTotal || !Number.isFinite(value) || value === 0) return DASH
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

const BalanceCell = ({ value, isScanning }: { value?: string; isScanning?: boolean }) => (
  <Typography variant="body2" color="text.primary">
    {!value && isScanning ? <Skeleton variant="rounded" width={50} height={20} /> : formatBalance(value)}
  </Typography>
)

// Pure helper functions — extracted from component body for testability and to avoid recreation per render.
// Utilities are threaded in via parameters (not imported) to comply with feature architecture —
// callers obtain them from useLoadFeature(SecurityFeature).
type SecurityUtils = Pick<SecurityContract, 'scanKey' | 'computeSummary' | 'severityRank'>

const getAggregateSummary = (
  safe: SpaceSafeEntry,
  scanResults: Record<string, Record<string, ScanResult>>,
  utils: SecurityUtils,
): GradeSummary | null => {
  let totalPassing = 0
  let totalApplicable = 0
  let worstGradeRank = 4
  let hasCriticalIssue = false
  let hasAny = false

  for (const chain of safe.chainEntries) {
    const key = utils.scanKey(safe.address, chain.chainId)
    const results = scanResults[key]
    if (!results) continue
    const summary = utils.computeSummary(results)
    if (!summary) continue
    hasAny = true
    totalPassing += summary.passing
    totalApplicable += summary.applicableCount
    if (summary.hasCriticalIssue) hasCriticalIssue = true
    const rank = utils.severityRank(summary.grade)
    if (rank < worstGradeRank) worstGradeRank = rank
  }

  if (!hasAny) return null
  const gradeMap = ['Critical', 'High', 'Medium', 'Low'] as const
  return {
    passing: totalPassing,
    applicableCount: totalApplicable,
    grade: gradeMap[worstGradeRank] ?? 'Low',
    hasCriticalIssue,
  }
}

const hasMultichainWarning = (
  safe: SpaceSafeEntry,
  scanResults: Record<string, Record<string, ScanResult>>,
  scanKey: SecurityContract['scanKey'],
): boolean => {
  for (const chain of safe.chainEntries) {
    const key = scanKey(safe.address, chain.chainId)
    const results = scanResults[key]
    if (!results) continue
    const multichainResult = results['multichain_setup']
    if (multichainResult && multichainResult.status !== 'clear' && multichainResult.status !== 'not_applicable') {
      return true
    }
  }
  return false
}

const isAnyChainScanning = (
  safe: SpaceSafeEntry,
  scanningKeys: Set<string> | undefined,
  scanKey: SecurityContract['scanKey'],
): boolean => {
  if (!scanningKeys) return false
  return safe.chainEntries.some((c) => scanningKeys.has(scanKey(safe.address, c.chainId)))
}

type SecuritySafesTableProps = {
  safes: SpaceSafeEntry[]
  onViewReport: (address: string, chainId: string) => void
  selectedSafe: SelectedSafe | null
  scanResults: Record<string, Record<string, ScanResult>>
  scanTimestamps?: Record<string, number>
  scanningKeys?: Set<string>
  gradeFilter?: SafeGrade | null
  balanceMap: Record<string, string | undefined>
}

const SecuritySafesTable = ({
  safes,
  onViewReport,
  selectedSafe,
  scanResults,
  scanTimestamps,
  scanningKeys,
  gradeFilter,
  balanceMap,
}: SecuritySafesTableProps): ReactElement => {
  const security = useLoadFeature(SecurityFeature)
  const { data: chainsData } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)
  const chainShortNames = useMemo(() => {
    if (!chainsData) return {}
    const map: Record<string, string> = {}
    for (const id of chainsData.ids) {
      const chain = chainsData.entities[id]
      if (chain) map[chain.chainId] = chain.shortName
    }
    return map
  }, [chainsData])

  // Link the Safe name to that Safe's home dashboard. The per-Safe security view
  // now lives entirely inside this hub's drawer — clicking the row still opens it.
  const getSafeSecurityHref = useCallback(
    (address: string, chainId: string) => {
      const shortName = chainShortNames[chainId]
      if (!shortName) return undefined
      return { pathname: AppRoutes.home, query: { safe: `${shortName}:${address}` } }
    },
    [chainShortNames],
  )

  const [expandedAddresses, setExpandedAddresses] = useState<Set<string>>(new Set())

  const toggleExpand = useCallback((address: string) => {
    setExpandedAddresses((prev) => {
      const next = new Set(prev)
      if (next.has(address)) next.delete(address)
      else next.add(address)
      return next
    })
  }, [])

  // Skip initial-load stagger after the first render — filter transitions should be instant
  const hasAnimatedRef = useRef(false)
  useEffect(() => {
    hasAnimatedRef.current = true
  }, [])

  // Filter safes by grade when a chip filter is active
  const filteredSafes = useMemo(() => {
    if (!gradeFilter) return safes
    if (!security.$isReady) return safes
    return safes.filter((safe) => {
      // For multichain Safes, match if ANY chain matches the grade
      for (const chain of safe.chainEntries) {
        const key = security.scanKey(safe.address, chain.chainId)
        const results = scanResults[key]
        if (results && security.getSafeGrade(results) === gradeFilter) return true
      }
      return false
    })
  }, [safes, scanResults, gradeFilter, security.$isReady, security.scanKey, security.getSafeGrade])

  // Gate remaining render on feature load. Utilities are synchronous call-site primitives —
  // pulling them via useLoadFeature means we must wait for the module to resolve.
  // Since FEATURES.SPACES is already enabled on this page, this is a very brief state.
  if (!security.$isReady) return <></>

  // After the $isReady check, services are guaranteed to be defined.
  const { scanKey, computeSummary, formatTimestamp, getStrengthLevel, getStrengthColor } = security

  return (
    <Table
      sx={{
        fontFamily: '"DM Sans", system-ui, sans-serif',
        tableLayout: 'fixed',
        borderCollapse: 'separate',
        borderSpacing: '0 4px',
        '& th': {
          border: 'none',
          borderBottom: 'none !important',
          py: 0.5,
          px: 2,
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0',
          color: '#737373',
          textTransform: 'none',
          fontFamily: '"DM Sans", system-ui, sans-serif',
        },
        '& td': {
          border: 'none',
          height: 64,
          py: 0,
          px: 2,
          backgroundColor: 'background.paper',
          transition: 'background-color 0.12s ease',
          verticalAlign: 'middle',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          '& .MuiTypography-body2': {
            fontWeight: 500,
            fontSize: '14px',
            fontFamily: '"DM Sans", system-ui, sans-serif',
          },
          '& .MuiTypography-caption': { fontSize: '12px', fontFamily: '"DM Sans", system-ui, sans-serif' },
        },
        '& tbody tr:hover td': {
          backgroundColor: '#f5f5f5',
        },
        '& th:first-of-type': { pl: 2 },
        '& td:first-of-type': { borderTopLeftRadius: 20, borderBottomLeftRadius: 20, pl: 2 },
        '& td:last-of-type': { borderTopRightRadius: 20, borderBottomRightRadius: 20, pr: 2, overflow: 'hidden' },
      }}
    >
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: '26%' }}>Account</TableCell>
          <TableCell sx={{ width: '12%' }}>Network</TableCell>
          <TableCell sx={{ width: '10%' }}>Balance</TableCell>
          <TableCell sx={{ width: '10%' }}>Threshold</TableCell>
          <TableCell sx={{ width: '9%' }}>Version</TableCell>
          <TableCell sx={{ width: '11%' }}>Score</TableCell>
          <TableCell sx={{ width: '13%' }}>Last scanned</TableCell>
          <TableCell sx={{ width: '9%' }} />
        </TableRow>
      </TableHead>
      <AnimatePresence mode="wait">
        <MotionTbody
          key={gradeFilter ?? 'all'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {filteredSafes.map((safe, safeIdx) => {
            const isMultichain = safe.isMultichain && safe.chainEntries.length > 1
            const isExpanded = expandedAddresses.has(safe.address)

            if (!isMultichain) {
              const key = scanKey(safe.address, safe.chainId)
              const summary = scanResults[key] ? computeSummary(scanResults[key]) : null
              const isSelected = selectedSafe?.address === safe.address && selectedSafe?.chainId === safe.chainId
              const isScanning = scanningKeys?.has(key)

              const safeHref = getSafeSecurityHref(safe.address, safe.chainId)
              const isDeployed = safe.chainEntries[0]?.isDeployed !== false

              return (
                <MotionTableRow
                  key={key}
                  variants={ROW_VARIANTS}
                  initial={hasAnimatedRef.current ? false : 'hidden'}
                  animate="visible"
                  transition={{ duration: 0.2, delay: hasAnimatedRef.current ? 0 : safeIdx * 0.03 }}
                  selected={isSelected}
                  hover={isDeployed}
                  onClick={isDeployed ? () => onViewReport(safe.address, safe.chainId) : undefined}
                  sx={isDeployed ? { cursor: 'pointer' } : {}}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Identicon address={safe.address} size={40} />
                      <Stack sx={{ minWidth: 0, gap: '6px' }}>
                        <Typography
                          variant="body2"
                          noWrap
                          component={safeHref ? Link : 'span'}
                          {...(safeHref ? { href: safeHref } : {})}
                          title={safe.name || safe.address}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          sx={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textDecoration: 'none',
                            color: 'inherit',
                            '&:hover': safeHref ? { textDecoration: 'underline' } : {},
                          }}
                        >
                          {safe.name || shortenAddress(safe.address)}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1 }}>
                          {shortenAddress(safe.address)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <ChainIndicator chainId={safe.chainId} onlyLogo />
                  </TableCell>
                  <TableCell>
                    <BalanceCell value={balanceMap[key]} isScanning={isScanning} />
                  </TableCell>
                  <TableCell>
                    <ThresholdCell results={scanResults[key]} isScanning={isScanning} />
                  </TableCell>
                  <TableCell>
                    <VersionCell results={scanResults[key]} isScanning={isScanning} />
                  </TableCell>
                  <TableCell>
                    <ScoreCell
                      summary={summary}
                      isScanning={isScanning}
                      getStrengthLevel={getStrengthLevel}
                      getStrengthColor={getStrengthColor}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {scanTimestamps?.[key] ? formatTimestamp(scanTimestamps[key]) : DASH}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {isDeployed ? (
                      <ChevronRightRoundedIcon
                        sx={{
                          color: isSelected ? 'primary.main' : 'text.secondary',
                          verticalAlign: 'middle',
                        }}
                      />
                    ) : (
                      <Tooltip title="Safe not yet deployed on this network">
                        <Typography variant="caption" color="text.disabled" noWrap>
                          Not deployed
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                </MotionTableRow>
              )
            }

            const aggregateSummary = getAggregateSummary(safe, scanResults, security)
            const aggregateScanning = isAnyChainScanning(safe, scanningKeys, scanKey)
            const showMultichainWarning = hasMultichainWarning(safe, scanResults, scanKey)
            const totalBalance = safe.chainEntries.reduce(
              (sum, c) => sum + (Number(balanceMap[scanKey(safe.address, c.chainId)]) || 0),
              0,
            )
            const chainTimestamps = safe.chainEntries
              .map((c) => scanTimestamps?.[scanKey(safe.address, c.chainId)])
              .filter((t): t is number => !!t)
            const oldestTimestamp = chainTimestamps.length > 0 ? Math.min(...chainTimestamps) : null

            return (
              <Fragment key={safe.address}>
                <MotionTableRow
                  variants={ROW_VARIANTS}
                  initial={hasAnimatedRef.current ? false : 'hidden'}
                  animate="visible"
                  transition={{ duration: 0.2, delay: hasAnimatedRef.current ? 0 : safeIdx * 0.03 }}
                  hover
                  sx={{ cursor: 'pointer', '& > *': { borderBottom: isExpanded ? 0 : undefined } }}
                  onClick={() => toggleExpand(safe.address)}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Identicon address={safe.address} size={40} />
                      <Stack sx={{ minWidth: 0, gap: '6px' }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Typography
                            variant="body2"
                            noWrap
                            title={safe.name || safe.address}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {safe.name || shortenAddress(safe.address)}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExpand(safe.address)
                            }}
                            sx={{ p: 0.25 }}
                          >
                            <ExpandMoreRoundedIcon
                              sx={{
                                fontSize: 18,
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                              }}
                            />
                          </IconButton>
                          {showMultichainWarning && (
                            <Tooltip title="Signer setup differs across networks">
                              <WarningAmberRoundedIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                            </Tooltip>
                          )}
                        </Stack>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1 }}>
                          {shortenAddress(safe.address)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ml: '6px' }}>
                      <NetworkLogosList networks={safe.chainEntries.slice(0, 3).map((c) => ({ chainId: c.chainId }))} />
                      {safe.chainEntries.length > 3 && (
                        <Typography variant="caption" color="text.secondary">
                          +{safe.chainEntries.length - 3}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.primary">
                      {formatBalance(String(totalBalance))}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {DASH}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {DASH}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <ScoreCell
                      summary={aggregateSummary}
                      isScanning={aggregateScanning}
                      getStrengthLevel={getStrengthLevel}
                      getStrengthColor={getStrengthColor}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {oldestTimestamp ? formatTimestamp(oldestTimestamp) : DASH}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" />
                </MotionTableRow>

                {isExpanded &&
                  safe.chainEntries.map((chain, childIdx) => {
                    const key = scanKey(safe.address, chain.chainId)
                    const summary = scanResults[key] ? computeSummary(scanResults[key]) : null
                    const isSelected = selectedSafe?.address === safe.address && selectedSafe?.chainId === chain.chainId
                    const isScanning = scanningKeys?.has(key)
                    const childHref = getSafeSecurityHref(safe.address, chain.chainId)

                    return (
                      <MotionTableRow
                        key={key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15, delay: childIdx * 0.03 }}
                        selected={isSelected}
                        hover={chain.isDeployed}
                        onClick={chain.isDeployed ? () => onViewReport(safe.address, chain.chainId) : undefined}
                        sx={{
                          backgroundColor: 'background.paper',
                          cursor: chain.isDeployed ? 'pointer' : 'default',
                        }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component={childHref ? Link : 'span'}
                            {...(childHref ? { href: childHref } : {})}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            sx={{
                              pl: 5.5,
                              textDecoration: 'none',
                              color: 'text.secondary',
                              '&:hover': childHref ? { textDecoration: 'underline' } : {},
                            }}
                          >
                            {safe.name || shortenAddress(safe.address)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <ChainIndicator chainId={chain.chainId} onlyLogo />
                        </TableCell>
                        <TableCell>
                          <BalanceCell value={balanceMap[key]} isScanning={isScanning} />
                        </TableCell>
                        <TableCell>
                          <ThresholdCell results={scanResults[key]} isScanning={isScanning} />
                        </TableCell>
                        <TableCell>
                          <VersionCell results={scanResults[key]} isScanning={isScanning} />
                        </TableCell>
                        <TableCell>
                          <ScoreCell
                            summary={summary}
                            isScanning={isScanning}
                            getStrengthLevel={getStrengthLevel}
                            getStrengthColor={getStrengthColor}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {scanTimestamps?.[key] ? formatTimestamp(scanTimestamps[key]) : DASH}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {chain.isDeployed ? (
                            <ChevronRightRoundedIcon
                              sx={{
                                color: isSelected ? 'primary.main' : 'text.secondary',
                                verticalAlign: 'middle',
                              }}
                            />
                          ) : (
                            <Tooltip title="Safe not yet deployed on this network">
                              <Typography variant="caption" color="text.disabled" noWrap sx={{ fontSize: '0.65rem' }}>
                                Not deployed
                              </Typography>
                            </Tooltip>
                          )}
                        </TableCell>
                      </MotionTableRow>
                    )
                  })}
              </Fragment>
            )
          })}
        </MotionTbody>
      </AnimatePresence>
    </Table>
  )
}

export default SecuritySafesTable
