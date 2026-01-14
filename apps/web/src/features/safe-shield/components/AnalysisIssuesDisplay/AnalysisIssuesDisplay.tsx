import React from 'react'
import type {
  AnalysisResult,
  MaliciousOrModerateThreatAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { sortByIssueSeverity } from '@safe-global/utils/features/safe-shield/utils/analysisUtils'
import { Box, Typography, Tooltip } from '@mui/material'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import ExplorerButton from '@/components/common/ExplorerButton'
import { useState } from 'react'

interface AnalysisIssuesDisplayProps {
  result: AnalysisResult
  issueBackgroundColor: string
}

const issueBoxStyles = {
  display: 'flex',
  flexDirection: 'column',
  bgcolor: 'background.paper',
  borderRadius: '4px',
  overflow: 'hidden',
} as const

const addressTypographyStyles = {
  lineHeight: '20px',
  fontSize: 12,
  color: 'primary.light',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  overflowWrap: 'break-word',
  wordBreak: 'break-all',
  flex: 1,
  '&:hover': {
    color: 'text.primary',
  },
} as const

export const AnalysisIssuesDisplay = ({ result, issueBackgroundColor }: AnalysisIssuesDisplayProps) => {
  const currentChain = useCurrentChain()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  if (!('issues' in result)) {
    return null
  }

  const issues = result.issues as MaliciousOrModerateThreatAnalysisResult['issues']
  const sortedIssues = sortByIssueSeverity(issues)

  // Check if there are any actual issues to display (not just empty arrays)
  const hasAnyIssues = sortedIssues.some(({ issues: issueArray }) => issueArray.length > 0)
  if (!hasAnyIssues) {
    return null
  }

  const handleCopyToClipboard = async (address: string, index: number) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  let issueCounter = 0

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {sortedIssues.flatMap(({ severity, issues }) =>
        issues.map((issue, index) => {
          const globalIndex = issueCounter++
          const explorerLink =
            issue.address && currentChain ? getBlockExplorerLink(currentChain, issue.address) : undefined

          return (
            <Box key={`${severity}-${index}`} sx={issueBoxStyles}>
              {issue.address && (
                <Box sx={{ padding: '8px' }}>
                  <Typography
                    variant="body2"
                    lineHeight="20px"
                    onClick={() => handleCopyToClipboard(issue.address!, globalIndex)}
                  >
                    <Tooltip
                      title={copiedIndex === globalIndex ? 'Copied to clipboard' : 'Copy address'}
                      placement="top"
                      arrow
                    >
                      <Typography component="span" variant="body2" sx={addressTypographyStyles}>
                        {issue.address}
                      </Typography>
                    </Tooltip>
                    <Box component="span" color="text.secondary">
                      {explorerLink && <ExplorerButton href={explorerLink.href} />}
                    </Box>
                  </Typography>
                </Box>
              )}

              <Box bgcolor={issue.address ? issueBackgroundColor : 'transparent'} px={1} py={0.5}>
                <Typography variant="body2" fontSize={12} lineHeight="14px" color="primary.light">
                  {issue.description}
                </Typography>
              </Box>
            </Box>
          )
        }),
      )}
    </Box>
  )
}
