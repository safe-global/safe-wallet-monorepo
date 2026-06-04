import useAsync from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from '@/hooks/useSafeInfo'
import { isSafeAffectedByZodiacVulnerability } from '../services/vulnerableModules'

// Whether the current Safe is flagged by the Zodiac security-check. Checks any deployed Safe — a
// Safe with no modules can still be flagged when it is a member/signer of another Safe's module.
export const useVulnerableSafe = (): boolean => {
  const { safe, safeAddress } = useSafeInfo()

  const [isAffected] = useAsync<boolean>(
    () => {
      if (!safeAddress || !safe.deployed) return undefined
      return isSafeAffectedByZodiacVulnerability(safe.chainId, safeAddress)
    },
    [safeAddress, safe.chainId, safe.deployed],
    false,
  )

  return isAffected ?? false
}
