import useSafeInfo from '@/hooks/useSafeInfo'
import { useGetSafenetConfigQuery } from '@/store/safenet'
import { sameAddress } from '@/utils/addresses'
import { skipToken } from '@reduxjs/toolkit/query/react'
import useHasSafenetFeature from './useHasSafenetFeature'

const useIsSafenetEnabled = () => {
  const { safe } = useSafeInfo()
  const hasSafenetFeature = useHasSafenetFeature()
  const { data: safenetConfig } = useGetSafenetConfigQuery(!hasSafenetFeature ? skipToken : undefined)

  if (!hasSafenetFeature) {
    return false
  }

  return sameAddress(safe.guard?.value, safenetConfig?.guards[safe.chainId])
}

export default useIsSafenetEnabled
