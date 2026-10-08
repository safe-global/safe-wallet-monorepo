import React from 'react'
import type {
  AnalysisResult,
  MaliciousOrModerateThreatAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { sortByIssueSeverity } from '@safe-global/utils/features/safe-shield/utils/analysisUtils'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { useState } from 'react'
import {
  AnalysisIssuesDisplayView,
  type AnalysisIssueItem,
} from '@views/features/safe-shield/components/AnalysisIssuesDisplay/AnalysisIssuesDisplayView'

interface AnalysisIssuesDisplayProps {
  result: AnalysisResult
  issueBackgroundColor: string
}

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

  const items: AnalysisIssueItem[] = sortedIssues.flatMap(({ severity, issues }) =>
    issues.map((issue, index) => {
      const globalIndex = issueCounter++
      const explorerLink = issue.address && currentChain ? getBlockExplorerLink(currentChain, issue.address) : undefined

      return {
        key: `${severity}-${index}`,
        address: issue.address,
        explorerHref: explorerLink?.href,
        description: issue.description,
        isCopied: copiedIndex === globalIndex,
        onCopy: () => handleCopyToClipboard(issue.address!, globalIndex),
      }
    }),
  )

  return <AnalysisIssuesDisplayView issues={items} issueBackgroundColor={issueBackgroundColor} />
}
