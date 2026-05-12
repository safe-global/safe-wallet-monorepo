import { type ReactElement, useState, useCallback, useEffect, useMemo, useRef, Fragment } from 'react'
import { IconButton, Stack, Table, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material'
import { AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import type { ScanResult, SafeGrade } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import Identicon from '@/components/common/Identicon'
import ChainIndicator from '@/components/common/ChainIndicator'
import { NetworkLogosList } from '@/features/multichain'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import type { SelectedSafe, SpaceSafeEntry } from '../../types'
import StatusCell from '../StatusCell/StatusCell'
import { BalanceCell, ScoreCell, ThresholdCell, VersionCell } from './cells'
import { DASH, MotionTableRow, MotionTbody, ROW_VARIANTS } from './constants'
import {
  formatBalance,
  getAggregateSafeGrade,
  getAggregateSummary,
  hasMultichainWarning,
  isAnyChainScanning,
} from './utils'

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
  const { scanKey, computeSummary, formatTimestamp, getStrengthLevel, getStrengthColor, getSafeGrade } = security

  return (
    <Table
      sx={{
        tableLayout: 'fixed',
        borderCollapse: 'separate',
        borderSpacing: '0 6px',
        '& th': {
          border: 'none',
          borderBottom: 'none !important',
          py: 0.5,
          px: 2.5,
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'text.primary',
          opacity: 0.6,
        },
        '& td': {
          border: 'none',
          height: 72,
          py: 0,
          px: 2.5,
          backgroundColor: 'background.paper',
          transition: 'background-color 0.12s',
          verticalAlign: 'middle',
          '& .MuiTypography-body2': { fontWeight: 500, fontSize: '0.875rem' },
          '& .MuiTypography-caption': { fontSize: '0.75rem' },
        },
        '& tbody tr:hover td': {
          backgroundColor: 'success.background',
        },
        '& th:first-of-type': { pl: 0 },
        '& td:first-of-type': { borderTopLeftRadius: 12, borderBottomLeftRadius: 12, pl: 3 },
        '& td:last-of-type': { borderTopRightRadius: 12, borderBottomRightRadius: 12, pr: 3, overflow: 'hidden' },
      }}
    >
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: '22%' }}>Account</TableCell>
          <TableCell sx={{ width: '11%' }}>Network</TableCell>
          <TableCell sx={{ width: '9%' }}>Balance</TableCell>
          <TableCell sx={{ width: '9%' }}>Threshold</TableCell>
          <TableCell sx={{ width: '8%' }}>Version</TableCell>
          <TableCell sx={{ width: '11%' }}>Status</TableCell>
          <TableCell sx={{ width: '10%' }}>Score</TableCell>
          <TableCell sx={{ width: '12%' }}>Last scanned</TableCell>
          <TableCell sx={{ width: '8%' }} />
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
              const grade = scanResults[key] ? getSafeGrade(scanResults[key]) : null
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
                    <StatusCell grade={grade} isScanning={isScanning} />
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
            const aggregateGrade = getAggregateSafeGrade(safe, scanResults, scanKey, getSafeGrade)
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
                    <StatusCell grade={aggregateGrade} isScanning={aggregateScanning} />
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
                    const childGrade = scanResults[key] ? getSafeGrade(scanResults[key]) : null
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
                          <StatusCell grade={childGrade} isScanning={isScanning} />
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
