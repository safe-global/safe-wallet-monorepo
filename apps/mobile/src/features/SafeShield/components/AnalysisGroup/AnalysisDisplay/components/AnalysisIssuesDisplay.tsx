import React from 'react'
import type {
  AnalysisResult,
  MaliciousOrModerateThreatAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { sortByIssueSeverity } from '@safe-global/utils/features/safe-shield/utils/analysisUtils'
import { Text, View } from 'tamagui'

interface AnalysisIssuesDisplayProps {
  result: AnalysisResult
}

export function AnalysisIssuesDisplay({ result }: AnalysisIssuesDisplayProps) {
  if (!('issues' in result)) {
    return null
  }

  const issues = result.issues as MaliciousOrModerateThreatAnalysisResult['issues']
  const sortedIssues = sortByIssueSeverity(issues)

  return (
    <>
      {sortedIssues.flatMap(({ severity, issues }) =>
        issues.map((issue, index) => (
          <View key={`${severity}-${index}`} flexDirection="row" gap="$1" paddingLeft="$4" alignItems="flex-start">
            <View width={4} height={4} borderRadius={3} backgroundColor="$colorSecondary" marginTop={8} />
            <Text fontSize="$4" color="$colorSecondary" fontStyle="italic" flex={1}>
              {issue}
            </Text>
          </View>
        )),
      )}
    </>
  )
}
