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
}

const issueBoxStyles = {
  padding: '8px',
  gap: 1,
  display: 'flex',
  flexDirection: 'column',
  bgcolor: 'background.paper',
  borderRadius: '4px',
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

export const AnalysisIssuesDisplay = ({ result }: AnalysisIssuesDisplayProps) => {
  const currentChain = useCurrentChain()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  if (!('issues' in result)) {
    return null
  }

  const issues = result.issues as MaliciousOrModerateThreatAnalysisResult['issues']
  const sortedIssues = sortByIssueSeverity(issues)

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
              )}

              {issue.description && (
                <Typography variant="body2" color="primary.light" fontStyle="italic" fontSize={12}>
                  {issue.description}
                </Typography>
              )}
            </Box>
          )
        }),
      )}
    </Box>
  )
}
