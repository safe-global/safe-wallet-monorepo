import { useContext } from 'react'
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import type { SafeTransaction } from '@safe-global/types-kit'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useSafeTxHash } from '@/components/transactions/TxDetails/Summary/SafeTxHashDataRow'
import { useTxAiInsight } from './useTxAiInsight'
import type { TxAiRiskLevel } from './types'

const RISK_COLOR: Record<TxAiRiskLevel, 'success' | 'warning' | 'error' | 'default'> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'error',
  unknown: 'default',
}

const RiskChip = ({ level }: { level: TxAiRiskLevel }) => (
  <Chip size="small" color={RISK_COLOR[level]} label={`${level[0].toUpperCase()}${level.slice(1)} risk`} />
)

const TxAiInsightContent = ({ safeTxData }: { safeTxData: SafeTransaction['data'] }) => {
  const safeTxHash = useSafeTxHash({ safeTxData })
  const { insight, isStale, isLoading, error, isConfigured, generate } = useTxAiInsight(
    safeTxData,
    safeTxHash ?? undefined,
  )

  return (
    <Paper sx={{ p: 2 }} data-testid="tx-ai-insight">
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <AutoAwesomeIcon fontSize="small" color="primary" />
        <Typography variant="overline" color="text.secondary">
          AI insight
        </Typography>
      </Stack>

      {!isConfigured ? (
        <Typography variant="body2" color="text.secondary">
          AI insights are not configured yet.
        </Typography>
      ) : insight ? (
        <Stack spacing={1}>
          <RiskChip level={insight.riskLevel} />
          <Typography variant="body2">{insight.description}</Typography>
          <Typography variant="body2" color="text.secondary">
            {insight.riskSummary}
          </Typography>

          {isStale && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              The transaction changed since this was generated — regenerate to refresh.
            </Alert>
          )}

          {error && <Alert severity="error">{error.message}</Alert>}

          <Box>
            <Button size="small" variant="text" onClick={generate} disabled={isLoading} data-testid="tx-ai-regenerate">
              {isLoading ? <CircularProgress size={16} /> : 'Regenerate'}
            </Button>
          </Box>
        </Stack>
      ) : (
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Generate a plain-language summary and risk assessment of this transaction.
          </Typography>
          {error && <Alert severity="error">{error.message}</Alert>}
          <Box>
            <Button
              size="small"
              variant="outlined"
              onClick={generate}
              disabled={isLoading}
              data-testid="tx-ai-generate"
            >
              {isLoading ? <CircularProgress size={16} /> : 'Generate AI insight'}
            </Button>
          </Box>
        </Stack>
      )}
    </Paper>
  )
}

/**
 * AI insight box. Renders nothing until a safeTx exists (so it appears alongside the hashes panel
 * once the user has entered a valid transaction).
 */
export const TxAiInsight = () => {
  const { safeTx } = useContext(SafeTxContext)

  if (!safeTx) return null

  return <TxAiInsightContent safeTxData={safeTx.data} />
}

export default TxAiInsight
