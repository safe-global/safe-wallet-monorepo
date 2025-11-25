import { GroupedAnalysisResults, Severity } from '@safe-global/utils/features/safe-shield/types'
import { mapVisibleAnalysisResults } from '@safe-global/utils/features/safe-shield/utils'
import { getPrimaryAnalysisResult } from '@safe-global/utils/features/safe-shield/utils/getPrimaryAnalysisResult'
import { isEmpty } from 'lodash'
import React, { useMemo } from 'react'
import { Stack } from 'tamagui'
import { AnalysisLabel } from '../AnalysisLabel'
import { AnalysisDisplay } from './AnalysisDisplay'

interface AnalysisGroup {
  data: Record<string, GroupedAnalysisResults>
  highlightedSeverity?: Severity
  delay?: number
}

export const AnalysisGroup = ({ data, highlightedSeverity }: AnalysisGroup) => {
  const visibleResults = useMemo(() => mapVisibleAnalysisResults(data), [data])
  const primaryResult = useMemo(() => getPrimaryAnalysisResult(data), [data])
  const isDataEmpty = useMemo(() => isEmpty(data), [data])

  if (!primaryResult || isDataEmpty) {
    return null
  }

  const primarySeverity = primaryResult.severity
  const isHighlighted = !highlightedSeverity || primarySeverity === highlightedSeverity

  return (
    <Stack gap="$3">
      <AnalysisLabel label={primaryResult.title} severity={primarySeverity} highlighted={isHighlighted} />

      {visibleResults.map((result, index) => {
        const isPrimary = index === 0
        const shouldHighlight = isHighlighted && isPrimary && result.severity === primarySeverity

        return (
          <AnalysisDisplay
            key={result.title}
            severity={shouldHighlight ? result.severity : undefined}
            result={result}
          />
        )
      })}
    </Stack>
  )
}
