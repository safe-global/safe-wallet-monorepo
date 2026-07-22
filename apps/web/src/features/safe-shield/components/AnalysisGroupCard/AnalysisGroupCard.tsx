import { type ReactElement, type ReactNode, type TransitionEvent, useMemo, useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Typography } from '@/components/ui/typography'
import {
  ContractStatus,
  RecipientStatus,
  type GroupedAnalysisResults,
  type Severity,
  type StatusGroup,
} from '@safe-global/utils/features/safe-shield/types'
import { mapVisibleAnalysisResults } from '@safe-global/utils/features/safe-shield/utils'
import { getPrimaryAnalysisResult } from '@safe-global/utils/features/safe-shield/utils/getPrimaryAnalysisResult'
import { SeverityIcon } from '../SeverityIcon'
import { AnalysisGroupCardItem } from './AnalysisGroupCardItem'
import { AddressPoisoningCardItem } from './AddressPoisoningCardItem'
import { DelegateCallCardItem } from './DelegateCallCardItem'
import { FallbackHandlerCardItem } from './FallbackHandlerCardItem'
import { type AnalyticsEvent, MixpanelEventParams, trackEvent } from '@/services/analytics'
import isEmpty from 'lodash/isEmpty'

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
  // The reveal animation caps max-height (can't animate to `auto`); once it finishes we drop the cap
  // so tall content (many warnings) isn't clipped behind the widget footer.
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

  // Track analytics event when results change
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

  // Drop the reveal's max-height cap once its own transition ends (ignore opacity + bubbling Collapse height).
  const handleRevealTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.propertyName === 'max-height' && isVisible) setRevealed(true)
  }

  return (
    <Collapsible
      open={isOpen}
      data-testid={dataTestId}
      onTransitionEnd={handleRevealTransitionEnd}
      style={{
        // Capped during the reveal (animatable), uncapped after — see `revealed` above.
        overflow: revealed ? 'visible' : 'hidden',
        opacity: isVisible ? 1 : 0,
        maxHeight: revealed ? 'none' : isVisible ? 1000 : 0,
        transition: `opacity 0.6s ease-in-out, max-height 0.6s ease-in-out`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Card header - always visible */}
      <div className="flex cursor-pointer flex-row items-center justify-between p-3" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex flex-row items-center gap-2">
          <SeverityIcon severity={primaryResult.severity} muted={!isHighlighted} />
          <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
            {primaryResult.title}
          </Typography>
        </div>

        <ChevronDown
          className={`size-4 text-[var(--color-text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Expanded content */}
      <CollapsibleContent keepMounted>
        <div className="px-3 pt-1 pb-4">
          <div className="flex flex-col gap-2">
            {visibleResults.map((result, index) => {
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
            })}

            {footer}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
