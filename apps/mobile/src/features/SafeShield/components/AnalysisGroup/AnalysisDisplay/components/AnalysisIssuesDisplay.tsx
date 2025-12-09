import React from 'react'
import type {
  AnalysisResult,
  MaliciousOrModerateThreatAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { sortByIssueSeverity } from '@safe-global/utils/features/safe-shield/utils/analysisUtils'
import { Text } from 'tamagui'
import { AddressListItem } from './AddressListItem'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import { useAnalysisAddress } from '@/src/features/SafeShield/hooks/useAnalysisAddress'
import { AnalysisPaper } from '../../../AnalysisPaper'

interface AnalysisIssuesDisplayProps {
  result: AnalysisResult
}

export function AnalysisIssuesDisplay({ result }: AnalysisIssuesDisplayProps) {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const { handleOpenExplorer, handleCopyToClipboard, copiedIndex } = useAnalysisAddress()

  if (!('issues' in result)) {
    return null
  }

  const issues = result.issues as MaliciousOrModerateThreatAnalysisResult['issues']
  const sortedIssues = sortByIssueSeverity(issues)

  return (
    <>
      {sortedIssues.flatMap(({ severity, issues }) =>
        issues.map((issue, index) => {
          const explorerLink =
            activeChain?.blockExplorerUriTemplate &&
            getExplorerLink(issue.address ?? '', activeChain.blockExplorerUriTemplate)

          return (
            <AnalysisPaper key={`${severity}-${index}`} spaced={Boolean(explorerLink)}>
              {issue.address && (
                <AddressListItem
                  index={index}
                  copiedIndex={copiedIndex}
                  onCopy={handleCopyToClipboard}
                  explorerLink={explorerLink}
                  onOpenExplorer={handleOpenExplorer}
                  address={issue.address}
                />
              )}

              <Text fontSize="$3" marginTop="$2" color="$colorLight" fontStyle="italic">
                {issue.description}
              </Text>
            </AnalysisPaper>
          )
        }),
      )}
    </>
  )
}
