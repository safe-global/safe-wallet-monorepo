import { type ReactElement, type ReactNode, type TransitionEvent, useMemo, useState, useEffect, useRef } from 'react'
import {
  ContractStatus,
  RecipientStatus,
  type GroupedAnalysisResults,
  type Severity,
  type StatusGroup,
} from '@safe-global/utils/features/safe-shield/types'
import { mapVisibleAnalysisResults } from '@safe-global/utils/features/safe-shield/utils'
import { getPrimaryAnalysisResult } from '@safe-global/utils/features/safe-shield/utils/getPrimaryAnalysisResult'
import { AnalysisGroupCardItem } from './AnalysisGroupCardItem'
import { AddressPoisoningCardItem } from './AddressPoisoningCardItem'
import { DelegateCallCardItem } from './DelegateCallCardItem'
import { FallbackHandlerCardItem } from './FallbackHandlerCardItem'
import { type AnalyticsEvent, MixpanelEventParams, trackEvent } from '@/services/analytics'
import isEmpty from 'lodash/isEmpty'
import { AnalysisGroupCardView } from '@views/features/safe-shield/components/AnalysisGroupCard/AnalysisGroupCardView'

export interface AnalysisGroupCardProps {
  data: { [address: string]: GroupedAnalysisResults }
  showImage?: boolean
  highlightedSeverity?: Severity
  delay?: number
  analyticsEvent?: AnalyticsEvent
  'data-testid'?: string
  requestId?: string
  footer?: ReactNode
  expandedGroups?: StatusGroup[]
}

export const AnalysisGroupCard = ({
  data,
  showImage,
  highlightedSeverity,
  delay = 0,
  analyticsEvent,
  'data-testid': dataTestId,
  requestId,
  footer,
  expandedGroups,
}: AnalysisGroupCardProps): ReactElement | null => {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  // The reveal animation caps max-height (can't animate to `auto`); once it finishes the cap is dropped.
  const [revealed, setRevealed] = useState(false)

  const visibleResults = useMemo(() => mapVisibleAnalysisResults(data, expandedGroups), [data, expandedGroups])
  const primaryResult = useMemo(() => getPrimaryAnalysisResult(data), [data])
  const primarySeverity = primaryResult?.severity
  const isHighlighted = !highlightedSeverity || primarySeverity === highlightedSeverity
  const isDataEmpty = useMemo(() => isEmpty(data), [data])

  useEffect(() => {
    if (!primaryResult || isDataEmpty) {
      setIsVisible(false)
      setRevealed(false)
      return
    }

    setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }, [delay, primaryResult, isDataEmpty])

  const prevTrackedResultsKeyRef = useRef<string>('')
  useEffect(() => {
    if (analyticsEvent && visibleResults.length > 0) {
      const titles = visibleResults.map((result) => result.title)
      const key = JSON.stringify(titles)
      if (key !== prevTrackedResultsKeyRef.current) {
        trackEvent(analyticsEvent, { [MixpanelEventParams.RESULT]: titles })
        prevTrackedResultsKeyRef.current = key
      }
    }
  }, [analyticsEvent, visibleResults])

  if (!primaryResult || isDataEmpty) {
    return null
  }

  // Ignore opacity and the bubbling Collapse height transitions.
  const handleRevealTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.propertyName === 'max-height' && isVisible) setRevealed(true)
  }

  const items = visibleResults.map((result, index) => {
    const isPrimary = index === 0
    const shouldHighlight = isHighlighted && isPrimary && result.severity === primarySeverity

    if (result.type === ContractStatus.UNEXPECTED_DELEGATECALL) {
      return <DelegateCallCardItem key={index} result={result} isPrimary={isPrimary} />
    }

    if (result.type === ContractStatus.UNOFFICIAL_FALLBACK_HANDLER) {
      return <FallbackHandlerCardItem key={index} result={result} isPrimary={isPrimary} />
    }

    if (result.type === RecipientStatus.RESEMBLES_TRUSTED_ADDRESS) {
      return <AddressPoisoningCardItem key={index} result={result} />
    }

    return (
      <AnalysisGroupCardItem
        showImage={showImage}
        severity={shouldHighlight ? result.severity : undefined}
        key={index}
        result={result}
        requestId={requestId}
      />
    )
  })

  return (
    <AnalysisGroupCardView
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      data-testid={dataTestId}
      onTransitionEnd={handleRevealTransitionEnd}
      revealed={revealed}
      isVisible={isVisible}
      delay={delay}
      severity={primaryResult.severity}
      muted={!isHighlighted}
      title={primaryResult.title}
      items={items}
      footer={footer}
    />
  )
}
