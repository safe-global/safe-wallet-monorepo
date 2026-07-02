import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import useWallet from '@/hooks/wallets/useWallet'

/**
 * The three states of the "Local accounts" grouping, shared across the welcome
 * screen, the in-workspace Safe Accounts page, and the in-safe header dropdown so
 * the local-safes experience stays identical everywhere.
 *
 * - `connect-wallet`: no wallet connected and no trusted safes yet.
 * - `add-trusted`: wallet connected but the trusted list is empty.
 * - `list`: at least one trusted safe exists (shown regardless of connection).
 */
export type LocalAccountsView = 'connect-wallet' | 'add-trusted' | 'list'

const useLocalAccountsView = (): LocalAccountsView => {
  const wallet = useWallet()
  const addedSafes = useAppSelector(selectAllAddedSafes)

  return useMemo(() => {
    const hasTrustedSafes = Object.values(addedSafes).some((chain) => Object.keys(chain).length > 0)
    if (hasTrustedSafes) return 'list'
    return wallet ? 'add-trusted' : 'connect-wallet'
  }, [addedSafes, wallet])
}

export default useLocalAccountsView
