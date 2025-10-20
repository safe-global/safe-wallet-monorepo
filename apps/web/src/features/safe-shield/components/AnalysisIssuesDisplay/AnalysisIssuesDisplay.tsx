import React from 'react'
import type {
  AnalysisResult,
  AnyStatus,
  MaliciousOrModerateThreatAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { sortByIssueSeverity } from '@safe-global/utils/features/safe-shield/utils/analysisUtils'
import { Typography } from '@mui/material'

interface AnalysisIssuesDisplayProps {
  result: AnalysisResult<AnyStatus>
}

export const AnalysisIssuesDisplay = ({ result }: AnalysisIssuesDisplayProps) => {
  if (!('issues' in result)) {
    return null
  }

  const issues = result.issues as MaliciousOrModerateThreatAnalysisResult['issues']
  const sortedIssues = sortByIssueSeverity(issues)

  return sortedIssues.map(({ severity, issues }) => (
    <Typography key={severity} variant="body2" color="primary.light" fontStyle="italic">
      {issues.join(', ')}
    </Typography>
  ))
}
