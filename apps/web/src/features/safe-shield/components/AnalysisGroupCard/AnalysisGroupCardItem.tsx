import { Stack, Typography } from '@mui/material'
import { Box } from '@mui/material'
import { type AnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { isAddressChange } from '@safe-global/utils/features/safe-shield/utils'
import { SEVERITY_COLORS } from '../../constants'
import { AnalysisIssuesDisplay } from '../AnalysisIssuesDisplay'
import { AddressChanges } from '../AddressChanges'
import { ShowAllAddress } from './ShowAllAddress'

interface AnalysisGroupCardItemProps {
  result: AnalysisResult
  isPrimary?: boolean
  description?: React.ReactNode
}

export const AnalysisGroupCardItem = ({ result, isPrimary = false, description }: AnalysisGroupCardItemProps) => {
  const borderColor = isPrimary && result.severity ? SEVERITY_COLORS[result.severity].main : 'var(--color-border-main)'
  const displayDescription = description ?? result.description

  return (
    <Box bgcolor="background.main" borderRadius="4px" overflow="hidden">
      <Box sx={{ borderLeft: `4px solid ${borderColor}`, padding: '12px' }}>
        <Stack gap={2}>
          <Typography variant="body2" color="primary.light">
            {displayDescription}
          </Typography>

          <AnalysisIssuesDisplay result={result} />

          {isAddressChange(result) && <AddressChanges result={result} />}

          {result.addresses?.length && <ShowAllAddress addresses={result.addresses} />}
        </Stack>
      </Box>
    </Box>
  )
}
