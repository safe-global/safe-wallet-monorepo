import { ContractStatus, GroupedAnalysisResults, Severity } from '@safe-global/utils/features/safe-shield/types'
import { mapVisibleAnalysisResults } from '@safe-global/utils/features/safe-shield/utils'
import { getPrimaryAnalysisResult } from '@safe-global/utils/features/safe-shield/utils/getPrimaryAnalysisResult'
import { isEmpty } from 'lodash'
import React, { useMemo } from 'react'
import { Stack } from 'tamagui'
import { AnalysisLabel } from '../AnalysisLabel'
import { AnalysisDisplay } from './AnalysisDisplay'
import { DelegateCallItem } from './DelegateCallItem'
import { FallbackHandlerItem } from './FallbackHandlerItem'

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

        if (result.type === ContractStatus.UNEXPECTED_DELEGATECALL) {
          return <DelegateCallItem key={`${result.title}-${index}`} result={result} isPrimary={isPrimary} />
        }

        if (result.type === ContractStatus.UNOFFICIAL_FALLBACK_HANDLER) {
          return <FallbackHandlerItem key={`${result.title}-${index}`} result={result} isPrimary={isPrimary} />
        }

        return (
          <AnalysisDisplay
            key={`${result.title}-${index}`}
            severity={shouldHighlight ? result.severity : undefined}
            result={result}
          />
        )
      })}
    </Stack>
  )
}
