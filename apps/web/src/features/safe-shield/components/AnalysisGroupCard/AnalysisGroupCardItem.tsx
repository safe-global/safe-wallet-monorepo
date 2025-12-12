import { Stack, Typography } from '@mui/material'
import { Box } from '@mui/material'
import type { Severity } from '@safe-global/utils/features/safe-shield/types'
import {
  type AnalysisResult,
  type MaliciousOrModerateThreatAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { isAddressChange } from '@safe-global/utils/features/safe-shield/utils'
import { SEVERITY_COLORS, ISSUE_BACKGROUND_COLORS } from '../../constants'
import { AnalysisIssuesDisplay } from '../AnalysisIssuesDisplay'
import { AddressChanges } from '../AddressChanges'
import { ShowAllAddress } from '../ShowAllAddress/ShowAllAddress'

interface AnalysisGroupCardItemProps {
  result: AnalysisResult
  description?: React.ReactNode
  severity?: Severity
  showImage?: boolean
}

export const AnalysisGroupCardItem = ({ result, description, severity, showImage }: AnalysisGroupCardItemProps) => {
  const borderColor = severity ? SEVERITY_COLORS[severity].main : 'var(--color-border-main)'
  const issueBackgroundColor = severity ? (ISSUE_BACKGROUND_COLORS[severity] ?? '') : ''
  const displayDescription = description ?? result.description
  // Double-check in case if issues are undefined:
  const hasIssues = 'issues' in result && !!(result as MaliciousOrModerateThreatAnalysisResult).issues

  return (
    <Box bgcolor="background.main" borderRadius="4px" overflow="hidden">
      <Box sx={{ borderLeft: `4px solid ${borderColor}`, padding: '12px' }}>
        <Stack gap={2}>
          <Typography variant="body2" color="primary.light">
            {displayDescription}
          </Typography>

          <AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />

          {isAddressChange(result) && <AddressChanges result={result} />}

          {/* Only show ShowAllAddress dropdown if there are no issues (to avoid duplication) */}
          {!hasIssues && result.addresses?.length && (
            <ShowAllAddress addresses={result.addresses} showImage={showImage} />
          )}
        </Stack>
      </Box>
    </Box>
  )
}
