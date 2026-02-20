import { type ReactElement, type ReactNode, useMemo, useState, useEffect, useRef } from 'react'
import { Box, Typography, Stack, IconButton, Collapse } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import {
  ContractStatus,
  type GroupedAnalysisResults,
  type Severity,
} from '@safe-global/utils/features/safe-shield/types'
import { mapVisibleAnalysisResults } from '@safe-global/utils/features/safe-shield/utils'
import { getPrimaryAnalysisResult } from '@safe-global/utils/features/safe-shield/utils/getPrimaryAnalysisResult'
import { SeverityIcon } from '../SeverityIcon'
import { AnalysisGroupCardItem } from './AnalysisGroupCardItem'
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
}: AnalysisGroupCardProps): ReactElement | null => {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const visibleResults = useMemo(() => mapVisibleAnalysisResults(data), [data])
  const primaryResult = useMemo(() => getPrimaryAnalysisResult(data), [data])
  const primarySeverity = primaryResult?.severity
  const isHighlighted = !highlightedSeverity || primarySeverity === highlightedSeverity
  const isDataEmpty = useMemo(() => isEmpty(data), [data])

  useEffect(() => {
    if (!primaryResult || isDataEmpty) {
      setIsVisible(false)
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

  return (
    <Box
      data-testid={dataTestId}
      sx={{
        overflow: 'hidden',
        opacity: isVisible ? 1 : 0,
        maxHeight: isVisible ? 1000 : 0, // Replace 'fit-content' with a large px value for animatable maxHeight
        transition: `opacity 0.6s ease-in-out, max-height 0.6s ease-in-out`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Card header - always visible */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ padding: '12px', cursor: 'pointer' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <SeverityIcon severity={primaryResult.severity} muted={!isHighlighted} />
          <Typography variant="body2" color="primary.light">
            {primaryResult.title}
          </Typography>
        </Stack>

        <IconButton
          size="small"
          sx={{
            width: 16,
            height: 16,
            padding: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <KeyboardArrowDownIcon sx={{ width: 16, height: 16, color: 'text.secondary' }} />
        </IconButton>
      </Stack>

      {/* Expanded content */}
      <Collapse in={isOpen}>
        <Box sx={{ padding: '4px 12px 16px' }}>
          <Stack gap={1}>
            {visibleResults.map((result, index) => {
              const isPrimary = index === 0
              const shouldHighlight = isHighlighted && isPrimary && result.severity === primarySeverity

              if (result.type === ContractStatus.UNEXPECTED_DELEGATECALL) {
                return <DelegateCallCardItem key={index} result={result} isPrimary={isPrimary} />
              }

              if (result.type === ContractStatus.UNOFFICIAL_FALLBACK_HANDLER) {
                return <FallbackHandlerCardItem key={index} result={result} isPrimary={isPrimary} />
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
          </Stack>
        </Box>
      </Collapse>
    </Box>
  )
}
