import { useMemo } from 'react'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import type { SignerWallets } from '../components/SpaceTransactions/utils'

/** The signed-in user's linked wallets, the same ones the gateway counts toward the queue's `sign` status. */
export const useSignerWallets = (): SignerWallets => {
  const isSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isSignedIn })
  return useMemo(() => new Set((user?.wallets ?? []).map(({ address }) => address.toLowerCase())), [user])
}
