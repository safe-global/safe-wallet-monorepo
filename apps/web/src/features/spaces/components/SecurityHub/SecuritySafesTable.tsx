import { type ReactElement, useState, useCallback, Fragment } from 'react'
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
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import type { SpaceSafeEntry, SelectedSafe } from './index'
import { getStrengthLevel, getStrengthColor } from '@/features/security/data/securityScoring'
import type { ScanResult } from '@/features/security/data/scanners/types'
import { scanKey, computeSummary, severityRank, type GradeSummary } from '@/features/security/data/scanners/utils'
import Identicon from '@/components/common/Identicon'
import ChainIndicator from '@/components/common/ChainIndicator'
import { NetworkLogosList } from '@/features/multichain'
import { shortenAddress } from '@safe-global/utils/utils/formatters'

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
  const clearRatio = summary.healthy / (summary.atRisk + summary.needsAttention + summary.healthy)
  const level = getStrengthLevel(clearRatio)
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

const CountCell = ({ count }: { count: number | undefined }) => (
  <Typography variant="body2" fontWeight={count && count > 0 ? 700 : 400} color="text.primary">
    {count ?? DASH}
  </Typography>
)

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
    let totalAtRisk = 0
    let totalNeedsAttention = 0
    let totalHealthy = 0
    let worstGradeRank = 4
    let hasAny = false

    for (const chain of safe.chainEntries) {
      const key = scanKey(safe.address, chain.chainId)
      const results = scanResults[key]
      if (!results) continue
      const summary = computeSummary(results)
      if (!summary) continue
      hasAny = true
      totalAtRisk += summary.atRisk
      totalNeedsAttention += summary.needsAttention
      totalHealthy += summary.healthy
      const rank = severityRank(summary.grade)
      if (rank < worstGradeRank) worstGradeRank = rank
    }

    if (!hasAny) return null
    const gradeMap = ['Critical', 'High', 'Medium', 'Low'] as const
    return {
      atRisk: totalAtRisk,
      needsAttention: totalNeedsAttention,
      healthy: totalHealthy,
      grade: gradeMap[worstGradeRank] ?? 'Low',
    }
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
            <TableCell>At risk</TableCell>
            <TableCell>Needs attention</TableCell>
            <TableCell>Healthy</TableCell>
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

              return (
                <TableRow key={key} selected={isSelected}>
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
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <ChainIndicator chainId={safe.chainId} responsive />
                  </TableCell>
                  <TableCell>
                    <CountCell count={summary?.atRisk} />
                  </TableCell>
                  <TableCell>
                    <CountCell count={summary?.needsAttention} />
                  </TableCell>
                  <TableCell>
                    <CountCell count={summary?.healthy} />
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

            return (
              <Fragment key={safe.address}>
                <TableRow
                  hover
                  sx={{ cursor: 'pointer', '& > *': { borderBottom: isExpanded ? 0 : undefined } }}
                  onClick={() => toggleExpand(safe.address)}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
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
                    <CountCell count={aggregateSummary?.atRisk} />
                  </TableCell>
                  <TableCell>
                    <CountCell count={aggregateSummary?.needsAttention} />
                  </TableCell>
                  <TableCell>
                    <CountCell count={aggregateSummary?.healthy} />
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
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 5.5 }}>
                          {shortenAddress(safe.address)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <ChainIndicator chainId={chain.chainId} responsive />
                      </TableCell>
                      <TableCell>
                        <CountCell count={summary?.atRisk} />
                      </TableCell>
                      <TableCell>
                        <CountCell count={summary?.needsAttention} />
                      </TableCell>
                      <TableCell>
                        <CountCell count={summary?.healthy} />
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
