import { Fragment } from 'react'
import { IconButton, Stack, TableCell, Tooltip, Typography } from '@mui/material'
import Link from 'next/link'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import type { ScanResult } from '@/features/security/types'
import Identicon from '@/components/common/Identicon'
import ChainIndicator from '@/components/common/ChainIndicator'
import { NetworkLogosList } from '@/features/multichain'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import StatusCell from '../StatusCell/StatusCell'
import { BalanceCell, ScoreCell, ThresholdCell, VersionCell } from './cells'
import { DASH, MotionTableRow, ROW_VARIANTS } from './constants'
import {
  formatBalance,
  getAggregateSafeGrade,
  getAggregateSummary,
  hasMultichainWarning,
  isAnyChainScanning,
  type GetSafeSecurityHref,
  type RowSecurity,
} from './utils'
import type { ChainEntry, SelectedSafe, SpaceSafeEntry } from '../../types'

export type MultichainSafeRowProps = {
  safe: SpaceSafeEntry
  safeIdx: number
  hasAnimated: boolean
  isExpanded: boolean
  onToggleExpand: (address: string) => void
  selectedSafe: SelectedSafe | null
  onViewReport: (address: string, chainId: string) => void
  scanResults: Record<string, Record<string, ScanResult>>
  scanTimestamps?: Record<string, number>
  scanningKeys?: Set<string>
  balanceMap: Record<string, string | undefined>
  security: RowSecurity
  getSafeSecurityHref: GetSafeSecurityHref
}

type ChildRowProps = {
  safe: SpaceSafeEntry
  chain: ChainEntry
  childIdx: number
  selectedSafe: SelectedSafe | null
  onViewReport: (address: string, chainId: string) => void
  scanResults: Record<string, Record<string, ScanResult>>
  scanTimestamps?: Record<string, number>
  scanningKeys?: Set<string>
  balanceMap: Record<string, string | undefined>
  security: RowSecurity
  getSafeSecurityHref: GetSafeSecurityHref
}

/** Per-chain row rendered under an expanded multichain parent. */
const MultichainChildRow = ({
  safe,
  chain,
  childIdx,
  selectedSafe,
  onViewReport,
  scanResults,
  scanTimestamps,
  scanningKeys,
  balanceMap,
  security,
  getSafeSecurityHref,
}: ChildRowProps) => {
  const { scanKey, computeSummary, formatTimestamp, getStrengthLevel, getStrengthColor, getSafeGrade } = security
  const key = scanKey(safe.address, chain.chainId)
  const results = scanResults[key]
  const summary = results ? computeSummary(results) : null
  const childGrade = results ? getSafeGrade(results) : null
  const isSelected = sameAddress(selectedSafe?.address, safe.address) && selectedSafe?.chainId === chain.chainId
  const isScanning = scanningKeys?.has(key)
  const childHref = getSafeSecurityHref(safe.address, chain.chainId)

  return (
    <MotionTableRow
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
        <ThresholdCell results={results} isScanning={isScanning} />
      </TableCell>
      <TableCell>
        <VersionCell results={results} isScanning={isScanning} />
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
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'inline-block', whiteSpace: 'normal', lineHeight: 1.2, fontSize: '0.65rem' }}
            >
              Not deployed
            </Typography>
          </Tooltip>
        )}
      </TableCell>
    </MotionTableRow>
  )
}

/**
 * Collapsed parent row for a multichain Safe + the child rows for each chain
 * when expanded. The parent aggregates balance/score/grade/scan-state across
 * all chain entries; clicking the row toggles expansion.
 */
const MultichainSafeRow = ({
  safe,
  safeIdx,
  hasAnimated,
  isExpanded,
  onToggleExpand,
  selectedSafe,
  onViewReport,
  scanResults,
  scanTimestamps,
  scanningKeys,
  balanceMap,
  security,
  getSafeSecurityHref,
}: MultichainSafeRowProps) => {
  const { scanKey, formatTimestamp, getStrengthLevel, getStrengthColor, getSafeGrade } = security
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
    <Fragment>
      <MotionTableRow
        variants={ROW_VARIANTS}
        initial={hasAnimated ? false : 'hidden'}
        animate="visible"
        transition={{ duration: 0.2, delay: hasAnimated ? 0 : safeIdx * 0.03 }}
        hover
        sx={{ cursor: 'pointer', '& > *': { borderBottom: isExpanded ? 0 : undefined } }}
        onClick={() => onToggleExpand(safe.address)}
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
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {safe.name || shortenAddress(safe.address)}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleExpand(safe.address)
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
        safe.chainEntries.map((chain, childIdx) => (
          <MultichainChildRow
            key={scanKey(safe.address, chain.chainId)}
            safe={safe}
            chain={chain}
            childIdx={childIdx}
            selectedSafe={selectedSafe}
            onViewReport={onViewReport}
            scanResults={scanResults}
            scanTimestamps={scanTimestamps}
            scanningKeys={scanningKeys}
            balanceMap={balanceMap}
            security={security}
            getSafeSecurityHref={getSafeSecurityHref}
          />
        ))}
    </Fragment>
  )
}

export default MultichainSafeRow
