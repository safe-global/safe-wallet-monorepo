import { useMemo } from 'react'
import useChains, { useChain } from '@/hooks/useChains'
import { isAllowlistEnabled } from '../services/allowlistAvailability'

export const useIsAllowlistEnabled = (chainId: string): boolean => {
  const chain = useChain(chainId)
  return !!chain && isAllowlistEnabled(chain)
}

export const useIsAllowlistAvailableInSpace = (): boolean => {
  const { configs } = useChains()
  return useMemo(() => configs.some(isAllowlistEnabled), [configs])
}
