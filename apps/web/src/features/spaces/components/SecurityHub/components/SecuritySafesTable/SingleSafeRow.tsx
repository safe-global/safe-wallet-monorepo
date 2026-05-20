import { Stack, TableCell, Tooltip, Typography } from '@mui/material'
import Link from 'next/link'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import type { ScanResult } from '@/features/security/types'
import Identicon from '@/components/common/Identicon'
import ChainIndicator from '@/components/common/ChainIndicator'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import StatusCell from '../StatusCell/StatusCell'
import { BalanceCell, ScoreCell, ThresholdCell, VersionCell } from './cells'
import { DASH, MotionTableRow, ROW_VARIANTS } from './constants'
import type { GetSafeSecurityHref, RowSecurity } from './utils'
import type { SelectedSafe, SpaceSafeEntry } from '../../types'

export type SingleSafeRowProps = {
  safe: SpaceSafeEntry
  safeIdx: number
  hasAnimated: boolean
  selectedSafe: SelectedSafe | null
  onViewReport: (address: string, chainId: string) => void
  scanResults: Record<string, Record<string, ScanResult>>
  scanTimestamps?: Record<string, number>
  scanningKeys?: Set<string>
  balanceMap: Record<string, string | undefined>
  security: RowSecurity
  getSafeSecurityHref: GetSafeSecurityHref
}

/** Row for a Safe deployed on exactly one chain. */
const SingleSafeRow = ({
  safe,
  safeIdx,
  hasAnimated,
  selectedSafe,
  onViewReport,
  scanResults,
  scanTimestamps,
  scanningKeys,
  balanceMap,
  security,
  getSafeSecurityHref,
}: SingleSafeRowProps) => {
  const { scanKey, computeSummary, formatTimestamp, getStrengthLevel, getStrengthColor, getSafeGrade } = security
  const key = scanKey(safe.address, safe.chainId)
  const results = scanResults[key]
  const summary = results ? computeSummary(results) : null
  const grade = results ? getSafeGrade(results) : null
  const isSelected = selectedSafe?.address === safe.address && selectedSafe?.chainId === safe.chainId
  const isScanning = scanningKeys?.has(key)
  const safeHref = getSafeSecurityHref(safe.address, safe.chainId)
  const isDeployed = safe.chainEntries[0]?.isDeployed !== false

  return (
    <MotionTableRow
      variants={ROW_VARIANTS}
      initial={hasAnimated ? false : 'hidden'}
      animate="visible"
      transition={{ duration: 0.2, delay: hasAnimated ? 0 : safeIdx * 0.03 }}
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
        <ThresholdCell results={results} isScanning={isScanning} />
      </TableCell>
      <TableCell>
        <VersionCell results={results} isScanning={isScanning} />
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
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'inline-block', whiteSpace: 'normal', lineHeight: 1.2 }}
            >
              Not deployed
            </Typography>
          </Tooltip>
        )}
      </TableCell>
    </MotionTableRow>
  )
}

export default SingleSafeRow
