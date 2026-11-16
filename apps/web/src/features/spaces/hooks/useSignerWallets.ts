import { useMemo } from 'react'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import type { SignerWallets } from '../components/SpaceTransactions/utils'

/** The signed-in user's linked wallets and the connected one: a transaction any of them still has to sign is theirs. */
export const useSignerWallets = (): SignerWallets => {
  const isSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isSignedIn })
  const connected = useWallet()?.address
  return useMemo(
    () =>
      new Set(
        [...(user?.wallets ?? []).map(({ address }) => address), ...(connected ? [connected] : [])].map((address) =>
          address.toLowerCase(),
        ),
      ),
    [user, connected],
  )
}
