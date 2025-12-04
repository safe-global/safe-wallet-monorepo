import { useCallback } from 'react'
import {
  useSafeShieldReportFalseResultV1Mutation,
  type ReportEvent,
} from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { trackEvent } from '@/services/analytics'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics/events/safe-shield'

export type ReportFalseResultParams = {
  event: ReportEvent
  requestId: string
  details: string
}

export type UseReportFalseResultReturn = {
  reportFalseResult: (params: ReportFalseResultParams) => Promise<boolean>
  isLoading: boolean
}

/**
 * Hook for reporting false Blockaid scan results.
 * Wraps the auto-generated mutation hook with notification and analytics handling.
 */
export const useReportFalseResult = (): UseReportFalseResultReturn => {
  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()
  const dispatch = useAppDispatch()
  const [triggerReport, { isLoading }] = useSafeShieldReportFalseResultV1Mutation()

  const reportFalseResult = useCallback(
    async (params: ReportFalseResultParams): Promise<boolean> => {
      try {
        const result = await triggerReport({
          chainId,
          safeAddress,
          reportFalseResultRequestDto: {
            event: params.event,
            request_id: params.requestId,
            details: params.details,
          },
        }).unwrap()

        if (result.success) {
          trackEvent(SAFE_SHIELD_EVENTS.REPORT_SUBMITTED, { event: params.event })
          dispatch(
            showNotification({
              message: 'Report submitted successfully',
              variant: 'success',
              groupKey: 'report-false-result',
            }),
          )
          return true
        } else {
          throw new Error('Report submission failed')
        }
      } catch (error) {
        trackEvent(SAFE_SHIELD_EVENTS.REPORT_FAILED, { event: params.event })
        dispatch(
          showNotification({
            message: 'Failed to submit report. Please try again.',
            variant: 'error',
            groupKey: 'report-false-result',
          }),
        )
        return false
      }
    },
    [chainId, safeAddress, triggerReport, dispatch],
  )

  return {
    reportFalseResult,
    isLoading,
  }
}
