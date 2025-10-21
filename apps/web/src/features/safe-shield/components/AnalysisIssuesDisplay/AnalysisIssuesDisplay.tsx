import React from 'react'
import type {
  AnalysisResult,
  AnyStatus,
  MaliciousOrModerateThreatAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { sortByIssueSeverity } from '@safe-global/utils/features/safe-shield/utils/analysisUtils'
import { Box, Typography } from '@mui/material'
import { Circle } from '@mui/icons-material'

interface AnalysisIssuesDisplayProps {
  result: AnalysisResult<AnyStatus>
}

export const AnalysisIssuesDisplay = ({ result }: AnalysisIssuesDisplayProps) => {
  if (!('issues' in result)) {
    return null
  }

  const issues = result.issues as MaliciousOrModerateThreatAnalysisResult['issues']
  const sortedIssues = sortByIssueSeverity(issues)

  return sortedIssues.flatMap(({ severity, issues }) =>
    issues.map((issue, index) => (
      <Box display="flex" key={`${severity}-${index}`} gap={0.5} pl={2}>
        <Circle sx={{ fontSize: 6, color: 'primary.light', mt: 0.8 }} />

        <Typography variant="body2" color="primary.light" fontStyle="italic">
          {issue}
        </Typography>
      </Box>
    )),
  )
}
