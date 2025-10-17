import React from 'react'
import type {
  AnalysisResult,
  AnyStatus,
  MaliciousOrModerateThreatAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { Typography } from '@mui/material'

interface AnalysisIssuesDisplayProps {
  result: AnalysisResult<AnyStatus>
}

export const AnalysisIssuesDisplay = ({ result }: AnalysisIssuesDisplayProps) => {
  if (!('issues' in result)) {
    return null
  }

  const issues = result.issues as MaliciousOrModerateThreatAnalysisResult['issues']

  return Array.from(issues?.entries() || []).map(([severity, issues]) => (
    <Typography key={severity} variant="body2" color="primary.light" fontStyle="italic">
      {issues.join(', ')}
    </Typography>
  ))
}
