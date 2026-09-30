import React from 'react'
import type {
  AnalysisResult,
  MaliciousOrModerateThreatAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { sortByIssueSeverity } from '@safe-global/utils/features/safe-shield/utils/analysisUtils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import ExplorerButton from '@/components/common/ExplorerButton'
import { useState } from 'react'

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

  return (
    <div className="flex flex-col gap-2">
      {sortedIssues.flatMap(({ severity, issues }) =>
        issues.map((issue, index) => {
          const globalIndex = issueCounter++
          const explorerLink =
            issue.address && currentChain ? getBlockExplorerLink(currentChain, issue.address) : undefined

          return (
            <div
              key={`${severity}-${index}`}
              className="flex flex-col overflow-hidden rounded-[4px] bg-[var(--color-background-paper)]"
            >
              {issue.address && (
                <div className="p-2">
                  <div className="leading-5" onClick={() => handleCopyToClipboard(issue.address!, globalIndex)}>
                    <Tooltip>
                      <TooltipTrigger render={<span className="inline-flex" />}>
                        <Typography
                          variant="paragraph-mini"
                          className="flex-1 cursor-pointer leading-5 break-all text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-text-primary)] [overflow-wrap:break-word]"
                        >
                          {issue.address}
                        </Typography>
                      </TooltipTrigger>
                      <TooltipContent>
                        {copiedIndex === globalIndex ? 'Copied to clipboard' : 'Copy address'}
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-[var(--color-text-secondary)]">
                      {explorerLink && <ExplorerButton href={explorerLink.href} />}
                    </span>
                  </div>
                </div>
              )}

              <div
                className="px-2 py-1"
                style={{ backgroundColor: issue.address ? issueBackgroundColor : 'transparent' }}
              >
                <Typography variant="paragraph-mini" className="leading-[14px] text-[var(--color-primary-light)]">
                  {issue.description}
                </Typography>
              </div>
            </div>
          )
        }),
      )}
    </div>
  )
}
