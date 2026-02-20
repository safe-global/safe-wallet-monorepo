import React from 'react'
import type {
  AnalysisResult,
  MaliciousOrModerateThreatAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { sortByIssueSeverity } from '@safe-global/utils/features/safe-shield/utils/analysisUtils'
import { Text, View } from 'tamagui'
import { AddressListItem } from './AddressListItem'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import { useAnalysisAddress } from '@/src/features/SafeShield/hooks/useAnalysisAddress'
import { safeShieldStatusColors } from '../../../../theme'
import { useTheme } from '@/src/theme/hooks/useTheme'

interface AnalysisIssuesDisplayProps {
  result: AnalysisResult
  severity?: Severity
}

export function AnalysisIssuesDisplay({ result, severity }: AnalysisIssuesDisplayProps) {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const { handleOpenExplorer, handleCopyToClipboard, copiedIndex } = useAnalysisAddress()
  const { isDark } = useTheme()

  const getIssueBackgroundColor = (severity?: Severity): string => {
    if (!severity) {
      return 'transparent'
    }

    const colors = safeShieldStatusColors[isDark ? 'dark' : 'light']
    return colors[severity]?.background || 'transparent'
  }

  const issueBackgroundColor = getIssueBackgroundColor(severity)

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
        issues.map((issue) => {
          const globalIndex = issueCounter++
          const explorerLink =
            issue.address && activeChain?.blockExplorerUriTemplate
              ? getExplorerLink(issue.address, activeChain.blockExplorerUriTemplate)
              : undefined

          return (
            <View
              key={`${severity}-${globalIndex}`}
              backgroundColor="$backgroundPaper"
              borderRadius="$4"
              overflow="hidden"
            >
              {issue.address && (
                <View padding="$2">
                  <AddressListItem
                    index={globalIndex}
                    copiedIndex={copiedIndex}
                    onCopy={handleCopyToClipboard}
                    explorerLink={explorerLink}
                    onOpenExplorer={handleOpenExplorer}
                    address={issue.address}
                  />
                </View>
              )}

              {/* Show description if there is no address as a fallback */}
              {!issue.address && issue.description && (
                <View padding="$2">
                  <Text fontSize="$2" lineHeight={14} color="$colorLight">
                    {issue.description}
                  </Text>
                </View>
              )}

              {issue.address && (
                <View
                  backgroundColor={issue.address ? issueBackgroundColor : 'transparent'}
                  padding="$2"
                  width="100%"
                  borderBottomLeftRadius={'$4'}
                  borderBottomRightRadius={'$4'}
                >
                  <Text fontSize={'$2'} lineHeight={14} color="$colorLight" fontFamily="$body" fontWeight="400">
                    {issue.description}
                  </Text>
                </View>
              )}
            </View>
          )
        }),
      )}
    </>
  )
}
