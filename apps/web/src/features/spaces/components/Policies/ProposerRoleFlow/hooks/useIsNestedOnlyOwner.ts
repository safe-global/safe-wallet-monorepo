import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import { isOwner } from '@/utils/transaction-guards'

// The Workspace flow signs as the connected wallet, so only a direct owner's signature is accepted by the gateway.
export const useIsNestedOnlyOwner = (): boolean => {
  const wallet = useWallet()
  const { safe, safeLoaded } = useSafeInfo()
  const isNestedOwner = useIsNestedSafeOwner()

  return safeLoaded && !isOwner(safe.owners, wallet?.address) && Boolean(isNestedOwner)
}
