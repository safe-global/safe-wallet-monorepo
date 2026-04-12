import { type ReactElement, useState, useCallback, useMemo, Fragment } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import Link from 'next/link'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import type { SpaceSafeEntry, SelectedSafe } from './index'
import { getStrengthLevel, getStrengthColor } from '@/features/security/data/securityScoring'
import type { ScanResult } from '@/features/security/data/scanners/types'
import { scanKey, computeSummary, severityRank, type GradeSummary } from '@/features/security/data/scanners/utils'
import Identicon from '@/components/common/Identicon'
import ChainIndicator from '@/components/common/ChainIndicator'
import { NetworkLogosList } from '@/features/multichain'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { AppRoutes } from '@/config/routes'

const DASH = '—'

const StrengthCell = ({ summary, isScanning }: { summary: GradeSummary | null; isScanning?: boolean }) => {
  if (isScanning) {
    return <CircularProgress size={16} thickness={5} />
  }
  if (!summary) {
    return (
      <Typography variant="body2" color="text.secondary">
        {DASH}
      </Typography>
    )
  }
  const clearRatio = summary.applicableCount > 0 ? summary.passing / summary.applicableCount : 0
  const level = getStrengthLevel(clearRatio, summary.hasCriticalIssue)
  const color = getStrengthColor(level)

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <Typography variant="body2" fontWeight={600}>
        {level}
      </Typography>
    </Stack>
  )
}

const ChecksCell = ({ summary, isScanning }: { summary: GradeSummary | null; isScanning?: boolean }) => {
  if (isScanning) {
    return <CircularProgress size={16} thickness={5} />
  }
  return (
    <Typography variant="body2" color="text.primary">
      {summary ? `${summary.passing}/${summary.applicableCount}` : DASH}
    </Typography>
  )
}

type SecuritySafesTableProps = {
  safes: SpaceSafeEntry[]
  onViewReport: (address: string, chainId: string) => void
  selectedSafe: SelectedSafe | null
  scanResults: Record<string, Record<string, ScanResult>>
  scanningKeys?: Set<string>
}

const SecuritySafesTable = ({
  safes,
  onViewReport,
  selectedSafe,
  scanResults,
  scanningKeys,
}: SecuritySafesTableProps): ReactElement => {
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

  const getSafeSecurityHref = useCallback(
    (address: string, chainId: string) => {
      const shortName = chainShortNames[chainId]
      if (!shortName) return undefined
      return { pathname: AppRoutes.security, query: { safe: `${shortName}:${address}` } }
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

  const getAggregateSummary = (safe: SpaceSafeEntry): GradeSummary | null => {
    let totalPassing = 0
    let totalApplicable = 0
    let worstGradeRank = 4
    let hasCriticalIssue = false
    let hasAny = false

    for (const chain of safe.chainEntries) {
      const key = scanKey(safe.address, chain.chainId)
      const results = scanResults[key]
      if (!results) continue
      const summary = computeSummary(results)
      if (!summary) continue
      hasAny = true
      totalPassing += summary.passing
      totalApplicable += summary.applicableCount
      if (summary.hasCriticalIssue) hasCriticalIssue = true
      const rank = severityRank(summary.grade)
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

  const hasMultichainWarning = (safe: SpaceSafeEntry): boolean => {
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

  const isAnyChainScanning = (safe: SpaceSafeEntry): boolean => {
    if (!scanningKeys) return false
    return safe.chainEntries.some((c) => scanningKeys.has(scanKey(safe.address, c.chainId)))
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Account</TableCell>
            <TableCell>Network</TableCell>
            <TableCell>Checks passing</TableCell>
            <TableCell>Setup strength</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {safes.map((safe) => {
            const isMultichain = safe.isMultichain && safe.chainEntries.length > 1
            const isExpanded = expandedAddresses.has(safe.address)

            if (!isMultichain) {
              const key = scanKey(safe.address, safe.chainId)
              const summary = scanResults[key] ? computeSummary(scanResults[key]) : null
              const isSelected = selectedSafe?.address === safe.address && selectedSafe?.chainId === safe.chainId
              const isScanning = scanningKeys?.has(key)

              const safeHref = getSafeSecurityHref(safe.address, safe.chainId)

              return (
                <TableRow key={key} selected={isSelected}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Identicon address={safe.address} size={32} />
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        noWrap
                        component={safeHref ? Link : 'span'}
                        {...(safeHref ? { href: safeHref } : {})}
                        sx={{
                          width: 100,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': safeHref ? { textDecoration: 'underline' } : {},
                        }}
                      >
                        {safe.name || shortenAddress(safe.address)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <ChainIndicator chainId={safe.chainId} responsive />
                  </TableCell>
                  <TableCell>
                    <ChecksCell summary={summary} isScanning={isScanning} />
                  </TableCell>
                  <TableCell>
                    <StrengthCell summary={summary} isScanning={isScanning} />
                  </TableCell>
                  <TableCell align="right">
                    {safe.chainEntries[0]?.isDeployed !== false ? (
                      <Button
                        variant={isSelected ? 'contained' : 'text'}
                        size="small"
                        startIcon={<VisibilityRoundedIcon />}
                        onClick={() => onViewReport(safe.address, safe.chainId)}
                        sx={
                          isSelected
                            ? { backgroundColor: 'text.primary', '&:hover': { backgroundColor: 'text.primary' } }
                            : {}
                        }
                      >
                        {isSelected ? 'Close' : 'View report'}
                      </Button>
                    ) : (
                      <Tooltip title="Safe not yet deployed on this network">
                        <span>
                          <Button variant="text" size="small" disabled>
                            Not deployed
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              )
            }

            const aggregateSummary = getAggregateSummary(safe)
            const aggregateScanning = isAnyChainScanning(safe)
            const showMultichainWarning = hasMultichainWarning(safe)

            return (
              <Fragment key={safe.address}>
                <TableRow
                  hover
                  sx={{ cursor: 'pointer', '& > *': { borderBottom: isExpanded ? 0 : undefined } }}
                  onClick={() => toggleExpand(safe.address)}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Identicon address={safe.address} size={32} />
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        noWrap
                        sx={{ width: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {safe.name || shortenAddress(safe.address)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(safe.address)
                        }}
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
                    <ChecksCell summary={aggregateSummary} isScanning={aggregateScanning} />
                  </TableCell>
                  <TableCell>
                    <StrengthCell summary={aggregateSummary} isScanning={aggregateScanning} />
                  </TableCell>
                  <TableCell align="right" />
                </TableRow>

                {safe.chainEntries.map((chain) => {
                  const key = scanKey(safe.address, chain.chainId)
                  const summary = scanResults[key] ? computeSummary(scanResults[key]) : null
                  const isSelected = selectedSafe?.address === safe.address && selectedSafe?.chainId === chain.chainId
                  const isScanning = scanningKeys?.has(key)
                  const childHref = getSafeSecurityHref(safe.address, chain.chainId)

                  return (
                    <TableRow
                      key={key}
                      selected={isSelected}
                      sx={{
                        display: isExpanded ? 'table-row' : 'none',
                        backgroundColor: 'background.paper',
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          component={childHref ? Link : 'span'}
                          {...(childHref ? { href: childHref } : {})}
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
                        <ChainIndicator chainId={chain.chainId} responsive />
                      </TableCell>
                      <TableCell>
                        <ChecksCell summary={summary} isScanning={isScanning} />
                      </TableCell>
                      <TableCell>
                        <StrengthCell summary={summary} isScanning={isScanning} />
                      </TableCell>
                      <TableCell align="right">
                        {chain.isDeployed ? (
                          <Button
                            variant={isSelected ? 'contained' : 'text'}
                            size="small"
                            startIcon={<VisibilityRoundedIcon />}
                            onClick={() => onViewReport(safe.address, chain.chainId)}
                            sx={
                              isSelected
                                ? { backgroundColor: 'text.primary', '&:hover': { backgroundColor: 'text.primary' } }
                                : {}
                            }
                          >
                            {isSelected ? 'Close' : 'View report'}
                          </Button>
                        ) : (
                          <Tooltip title="Safe not yet deployed on this network">
                            <span>
                              <Button variant="text" size="small" disabled>
                                Not deployed
                              </Button>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default SecuritySafesTable
