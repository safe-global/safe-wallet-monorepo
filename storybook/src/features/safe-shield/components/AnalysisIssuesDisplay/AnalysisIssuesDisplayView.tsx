import React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import ExplorerButton from '@/components/common/ExplorerButton'

export type AnalysisIssueItem = {
  key: string
  address?: string
  explorerHref?: string
  description: string
  isCopied: boolean
  onCopy: () => void
}

export interface AnalysisIssuesDisplayViewProps {
  issues: AnalysisIssueItem[]
  issueBackgroundColor: string
}

export const AnalysisIssuesDisplayView = ({ issues, issueBackgroundColor }: AnalysisIssuesDisplayViewProps) => {
  return (
    <div className="flex flex-col gap-2">
      {issues.map((issue) => (
        <div key={issue.key} className="flex flex-col overflow-hidden rounded-[4px] bg-[var(--color-background-paper)]">
          {issue.address && (
            <div className="p-2">
              <div className="leading-5" onClick={issue.onCopy}>
                <Tooltip>
                  <TooltipTrigger render={<span className="inline-flex" />}>
                    <Typography
                      variant="paragraph-mini"
                      className="flex-1 cursor-pointer leading-5 break-all text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-text-primary)] [overflow-wrap:break-word]"
                    >
                      {issue.address}
                    </Typography>
                  </TooltipTrigger>
                  <TooltipContent>{issue.isCopied ? 'Copied to clipboard' : 'Copy address'}</TooltipContent>
                </Tooltip>
                <span className="text-[var(--color-text-secondary)]">
                  {issue.explorerHref && <ExplorerButton href={issue.explorerHref} />}
                </span>
              </div>
            </div>
          )}

          <div className="px-2 py-1" style={{ backgroundColor: issue.address ? issueBackgroundColor : 'transparent' }}>
            <Typography variant="paragraph-mini" className="leading-[14px] text-[var(--color-primary-light)]">
              {issue.description}
            </Typography>
          </div>
        </div>
      ))}
    </div>
  )
}
