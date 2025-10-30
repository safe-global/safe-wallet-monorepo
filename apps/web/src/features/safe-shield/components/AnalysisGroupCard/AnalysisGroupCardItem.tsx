import { Stack, Typography } from '@mui/material'
import { Box } from '@mui/material'
import { type Severity } from '@safe-global/utils/features/safe-shield/types'
import { SEVERITY_COLORS } from '../../constants'

interface AnalysisGroupCardItemProps {
  children?: React.ReactNode
  severity?: Severity
  description: React.ReactNode
}

export const AnalysisGroupCardItem = ({ children, severity, description }: AnalysisGroupCardItemProps) => {
  const borderColor = severity ? SEVERITY_COLORS[severity].main : 'var(--color-border-main)'

  return (
    <Box bgcolor="background.main" borderRadius="4px" overflow="hidden">
      <Box sx={{ borderLeft: `4px solid ${borderColor}`, padding: '12px' }}>
        <Stack gap={2}>
          <Typography variant="body2" color="primary.light">
            {description}
          </Typography>

          {children}
        </Stack>
      </Box>
    </Box>
  )
}
