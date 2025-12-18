import React from 'react'
import type {
  AnalysisResult,
  MaliciousOrModerateThreatAnalysisResult,
  Severity,
} from '@safe-global/utils/features/safe-shield/types'
import { sortByIssueSeverity } from '@safe-global/utils/features/safe-shield/utils/analysisUtils'
import { Text, View } from 'tamagui'
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
  severity?: Severity
}

export function AnalysisIssuesDisplay({ result, severity }: AnalysisIssuesDisplayProps) {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const { handleOpenExplorer, handleCopyToClipboard, copiedIndex } = useAnalysisAddress()

  const issueBackgroundColor = severity ? '$errorLight' : 'transparent'

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

  let issueCounter = 0

  return (
    <>
      {sortedIssues.flatMap(({ severity, issues }) =>
        issues.map((issue, index) => {
          const globalIndex = issueCounter++
          const explorerLink =
            issue.address && activeChain?.blockExplorerUriTemplate
              ? getExplorerLink(issue.address, activeChain.blockExplorerUriTemplate)
              : undefined

          return (
            <View key={`${severity}-${index}`}>
              <AnalysisPaper spaced={Boolean(explorerLink)}>
                {issue.address && (
                  <AddressListItem
                    index={globalIndex}
                    copiedIndex={copiedIndex}
                    onCopy={handleCopyToClipboard}
                    explorerLink={explorerLink}
                    onOpenExplorer={handleOpenExplorer}
                    address={issue.address}
                  />
                )}
              </AnalysisPaper>

              <View
                backgroundColor={issue.address ? issueBackgroundColor : 'transparent'}
                padding="$2"
                width="100%"
                borderBottomLeftRadius={'$4'}
                borderBottomRightRadius={'$4'}
              >
                <Text
                  fontSize={'$2'}
                  lineHeight={14}
                  color={issue.address ? '$color' : '$colorLight'}
                  fontFamily="$body"
                  fontWeight="400"
                >
                  {issue.description}
                </Text>
              </View>
            </View>
          )
        }),
      )}
    </>
  )
}
