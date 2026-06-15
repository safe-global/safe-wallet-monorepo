import { Stack, Tooltip, Typography } from '@mui/material'
import Link from 'next/link'
import { motion } from 'framer-motion'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import type { ScanResult } from '@/features/security/types'
import Identicon from '@/components/common/Identicon'
import ChainIndicator from '@/components/common/ChainIndicator'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { cn } from '@/utils/cn'
import StatusCell from '../StatusCell/StatusCell'
import { BalanceCell, ScoreCell } from './cells'
import { CARD_ROW_CLASS, CELL_BASE, GRID_COLS, HIDE_BALANCE, ROW_VARIANTS } from './constants'
import { getNonPassingCount, type GetSafeSecurityHref, type RowSecurity } from './utils'
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
  scanningKeys,
  balanceMap,
  security,
  getSafeSecurityHref,
}: SingleSafeRowProps) => {
  const { scanKey, computeSummary, getSafeGrade } = security
  const key = scanKey(safe.address, safe.chainId)
  const results = scanResults[key]
  const summary = results ? computeSummary(results) : null
  const grade = results ? getSafeGrade(results) : null
  const statusCount = getNonPassingCount(results)
  const isSelected = selectedSafe?.address === safe.address && selectedSafe?.chainId === safe.chainId
  const isScanning = scanningKeys?.has(key)
  const safeHref = getSafeSecurityHref(safe.address, safe.chainId)
  const isDeployed = safe.chainEntries[0]?.isDeployed !== false

  return (
    <motion.div
      data-testid="security-safe-row"
      data-selected={isSelected || undefined}
      variants={ROW_VARIANTS}
      initial={hasAnimated ? false : 'hidden'}
      animate="visible"
      transition={{ duration: 0.2, delay: hasAnimated ? 0 : safeIdx * 0.03 }}
      onClick={isDeployed ? () => onViewReport(safe.address, safe.chainId) : undefined}
      className={cn(CARD_ROW_CLASS, GRID_COLS, {
        'cursor-pointer hover:bg-muted/100': isDeployed,
        'cursor-default': !isDeployed,
        'border-primary': isSelected,
      })}
    >
      <div className={CELL_BASE}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0 }}>
          <Identicon address={safe.address} size={32} />
          <Stack sx={{ minWidth: 0, gap: '6px' }}>
            <Typography
              variant="body2"
              noWrap
              fontWeight={700}
              component={safeHref ? Link : 'span'}
              {...(safeHref ? { href: safeHref } : {})}
              title={safe.name || safe.address}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              sx={{
                display: 'block',
                fontSize: '0.8125rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': safeHref ? { textDecoration: 'underline' } : {},
              }}
            >
              {safe.name || shortenAddress(safe.address)}
            </Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', lineHeight: 1 }}>
              {shortenAddress(safe.address)}
            </Typography>
          </Stack>
        </Stack>
      </div>
      <div className={CELL_BASE}>
        <ChainIndicator chainId={safe.chainId} onlyLogo imageSize={18} />
      </div>
      <div className={cn(CELL_BASE, HIDE_BALANCE)}>
        <BalanceCell value={balanceMap[key]} isScanning={isScanning} />
      </div>
      <div className={cn(CELL_BASE, 'justify-start')}>
        <ScoreCell summary={summary} isScanning={isScanning} />
      </div>
      <div className={CELL_BASE}>
        <StatusCell grade={grade} count={statusCount} isScanning={isScanning} />
      </div>
      <div className={cn(CELL_BASE, 'justify-end')}>
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
              sx={{ display: 'inline-block', whiteSpace: 'normal', lineHeight: 1.2, textAlign: 'right' }}
            >
              Not deployed
            </Typography>
          </Tooltip>
        )}
      </div>
    </motion.div>
  )
}

export default SingleSafeRow
