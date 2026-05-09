import { useCallback } from 'react'
import { useSafeShieldReportFalseResultV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'
import useSafeInfo from '@/hooks/useSafeInfo'

export const useReportFalseResult = () => {
  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()
  const [reportFalseResultMutation, { isLoading }] = useSafeShieldReportFalseResultV1Mutation()

  const reportFalseResult = useCallback(
    async (params: { request_id: string; details: string }) => {
      if (!chainId || !safeAddress) {
        return false
      }

      try {
        const result = await reportFalseResultMutation({
          chainId,
          safeAddress,
          reportFalseResultRequestDto: {
            event: 'FALSE_POSITIVE',
            request_id: params.request_id,
            details: params.details,
          },
        }).unwrap()

        return result.success
      } catch (error) {
        console.error('Failed to report false result:', error)
        return false
      }
    },
    [chainId, safeAddress, reportFalseResultMutation],
  )

  return {
    reportFalseResult,
    isLoading,
  }
}
