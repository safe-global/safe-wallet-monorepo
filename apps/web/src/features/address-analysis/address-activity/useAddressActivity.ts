import { useEffect, useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import {
  analyzeAddressActivity,
  isLowActivityAddress,
  type AddressActivityAssessment,
  type ActivityLevel,
} from './addressActivityService'
import { ActivityMessages, AnalysisSeverity } from '../config'

type ActivityMessage = {
  title: string
  description: string
}

const getActivityMessage = (activityLevel: ActivityLevel): ActivityMessage => {
  return ActivityMessages[activityLevel]
}

/**
 * React hook to analyze address activity
 * @param address - Ethereum address to analyze
 * @returns Object containing activity assessment, loading state, error, title, description and severity
 */
export const useAddressActivity = (
  address: string | undefined,
): {
  assessment?: AddressActivityAssessment
  loading: boolean
  error?: Error
  title?: string
  description?: string
  severity?: AnalysisSeverity
} => {
  const web3ReadOnly = useWeb3ReadOnly()

  const [assessment, error, loading] = useAsync<AddressActivityAssessment | undefined>(async () => {
    if (!address || !web3ReadOnly) {
      return undefined
    }

    return analyzeAddressActivity(address, web3ReadOnly)
  }, [address, web3ReadOnly])

  const message = useMemo(() => {
    if (!assessment) return undefined
    return getActivityMessage(assessment.activityLevel)
  }, [assessment])

  const severity = useMemo(() => {
    if (!assessment) return undefined
    return isLowActivityAddress(assessment) ? AnalysisSeverity.WARN : AnalysisSeverity.INFO
  }, [assessment])

  useEffect(() => {
    if (error) {
      console.error('Address activity analysis error:', error)
    }
  }, [error])

  return {
    assessment,
    loading,
    error,
    title: message?.title,
    description: message?.description,
    severity,
  }
}
