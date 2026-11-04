import { type AnimationEvent, type ReactElement, type ReactNode, useMemo, useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
import { Typography } from '@safe-global/views/components/ui/typography'
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
import css from '../reveal.module.css'

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
  const [revealed, setRevealed] = useState(false)

  const visibleResults = useMemo(() => mapVisibleAnalysisResults(data, expandedGroups), [data, expandedGroups])
  const primaryResult = useMemo(() => getPrimaryAnalysisResult(data), [data])
  const primarySeverity = primaryResult?.severity
  const isHighlighted = !highlightedSeverity || primarySeverity === highlightedSeverity
  const isDataEmpty = useMemo(() => isEmpty(data), [data])
  const isShown = !!primaryResult && !isDataEmpty

  useEffect(() => {
    if (!isShown) setRevealed(false)
  }, [isShown])

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

  if (!isShown) {
    return null
  }

  const handleRevealEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setRevealed(true)
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      data-testid={dataTestId}
      className={revealed ? undefined : css.reveal}
      style={revealed ? undefined : { animationDelay: `${delay}ms` }}
      onAnimationEnd={handleRevealEnd}
    >
      {/* Card header - always visible */}
      <CollapsibleTrigger
        nativeButton={false}
        render={<div className="flex cursor-pointer flex-row items-center justify-between p-3" />}
      >
        <div className="flex flex-row items-center gap-2">
          <SeverityIcon severity={primaryResult.severity} muted={!isHighlighted} />
          <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
            {primaryResult.title}
          </Typography>
        </div>

        <ChevronDown
          className={`size-4 text-[var(--color-text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>

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
