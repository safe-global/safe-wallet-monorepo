import type { ReactElement } from 'react'
import { Box, CircularProgress, Paper, Skeleton, Stack, Typography } from '@mui/material'
import type { ScanResult } from '@/features/security/types'
import { usePanelHeader } from './hooks/usePanelHeader'

export type PanelHeaderProps = {
  results: Record<string, ScanResult>
  isComplete: boolean
}

/** Score gauge + strength level chip + action line at the top of the panel. */
const PanelHeader = ({ results, isComplete }: PanelHeaderProps): ReactElement | null => {
  const state = usePanelHeader(results, isComplete)

  if (state.status === 'loading') {
    return <Skeleton variant="rectangular" height={120} sx={{ borderRadius: '12px', mb: 3 }} />
  }
  if (state.status === 'empty') return null

  const { score, band, actionLine } = state

  return (
    <Paper sx={{ p: 2.5, borderRadius: '12px', mb: 3, backgroundColor: band.background }} elevation={0}>
      <Stack direction="row" spacing={2.5} alignItems="center">
        <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
          <CircularProgress variant="determinate" value={100} size={80} thickness={4} sx={{ color: 'border.light' }} />
          <CircularProgress
            variant="determinate"
            value={score}
            size={80}
            thickness={4}
            sx={{
              color: band.color,
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
            {band.label}
          </Typography>
          <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.5, mb: 0.5 }}>
            {band.description}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {actionLine}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

export default PanelHeader
