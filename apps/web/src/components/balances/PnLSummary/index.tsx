import { useState } from 'react'
import { Box, Paper, Typography, Grid, Stack, IconButton, Collapse, Chip } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import type { PnL } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import FiatValue from '@/components/common/FiatValue'

type PnLSummaryProps = {
  pnl: PnL
}

const PnLSummary = ({ pnl }: PnLSummaryProps) => {
  const [expanded, setExpanded] = useState(false)

  const totalPnL = pnl.realizedGain + pnl.unrealizedGain
  const roi = pnl.netInvested !== 0 ? (totalPnL / pnl.netInvested) : 0
  const isProfitable = totalPnL >= 0

  const formatValue = (value: number): string => {
    return value.toFixed(2)
  }

  const formatPercent = (value: number): string => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" fontWeight="bold">
            Portfolio Performance
          </Typography>
          {isProfitable ? (
            <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
          ) : (
            <TrendingDownIcon sx={{ color: 'error.main', fontSize: 20 }} />
          )}
        </Stack>
        <IconButton size="small" onClick={() => setExpanded(!expanded)} aria-label="Toggle details">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Stack>

      {/* Primary Metrics Grid */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={4}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Total P&L
            </Typography>
            <Typography
              variant="h5"
              fontWeight="bold"
              color={isProfitable ? 'success.main' : 'error.main'}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              {isProfitable ? '+' : ''}
              <FiatValue value={formatValue(totalPnL)} />
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Unrealized Gain
            </Typography>
            <Typography variant="h5" fontWeight="bold" color={pnl.unrealizedGain >= 0 ? 'success.main' : 'error.main'}>
              {pnl.unrealizedGain >= 0 ? '+' : ''}
              <FiatValue value={formatValue(pnl.unrealizedGain)} />
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Total Fees
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              <FiatValue value={formatValue(pnl.totalFee)} />
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Secondary Info */}
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <Typography variant="body2" color="text.secondary">
          Net Invested: <FiatValue value={formatValue(pnl.netInvested)} />
        </Typography>
        <Typography variant="body2" color="text.secondary">
          •
        </Typography>
        <Chip
          label={`ROI: ${formatPercent(roi)}`}
          size="small"
          color={roi >= 0 ? 'success' : 'error'}
          sx={{ fontWeight: 'bold' }}
        />
      </Stack>

      {/* Expanded Details */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box mt={3} pt={3} borderTop="1px solid" borderColor="divider">
          <Typography variant="subtitle2" fontWeight="bold" mb={2}>
            Detailed Breakdown
          </Typography>

          <Grid container spacing={2}>
            {/* Gains Breakdown */}
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Realized Gain
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight="medium"
                  color={pnl.realizedGain >= 0 ? 'success.main' : 'error.main'}
                >
                  {pnl.realizedGain >= 0 ? '+' : ''}
                  <FiatValue value={formatValue(pnl.realizedGain)} />
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Profit from sold assets
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Unrealized Gain
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight="medium"
                  color={pnl.unrealizedGain >= 0 ? 'success.main' : 'error.main'}
                >
                  {pnl.unrealizedGain >= 0 ? '+' : ''}
                  <FiatValue value={formatValue(pnl.unrealizedGain)} />
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Potential profit on holdings
                </Typography>
              </Box>
            </Grid>

            {/* External Transfers */}
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Received (External)
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  <FiatValue value={formatValue(pnl.receivedExternal)} />
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Value received from other wallets
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Sent (External)
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  <FiatValue value={formatValue(pnl.sentExternal)} />
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Value sent to other wallets
                </Typography>
              </Box>
            </Grid>

            {/* NFT Flows (only show if non-zero) */}
            {(pnl.sentForNfts !== 0 || pnl.receivedForNfts !== 0) && (
              <>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      Sent for NFTs
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      <FiatValue value={formatValue(pnl.sentForNfts)} />
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Assets spent on NFT purchases
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      Received for NFTs
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      <FiatValue value={formatValue(pnl.receivedForNfts)} />
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Assets from NFT sales
                    </Typography>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  )
}

export default PnLSummary
