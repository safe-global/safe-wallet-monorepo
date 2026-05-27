import { useEffect } from 'react'
import type { IWalletKit } from '@reown/walletkit'
import { getAddress } from 'ethers'
import { useAppSelector } from '@/src/store/hooks'
import { selectSessions } from '../store/walletKitSlice'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { SUPPORTED_NAMESPACE } from '../services/constants'

const eip155Caip2 = (chainId: string) => `${SUPPORTED_NAMESPACE}:${chainId}`

export const useActiveSafeBinding = (walletKit: IWalletKit | null) => {
  const activeSafe = useAppSelector(selectActiveSafe)
  const sessions = useAppSelector(selectSessions)

  useEffect(() => {
    if (!walletKit || !activeSafe) {
      return
    }
    const checksummed = getAddress(activeSafe.address)
    const chainCaip2 = eip155Caip2(activeSafe.chainId)
    const account = `${chainCaip2}:${checksummed}`

    sessions.forEach(async (session) => {
      try {
        const eip155 = session.namespaces[SUPPORTED_NAMESPACE]
        if (!eip155) {
          return
        }

        // 1) Update namespace accounts to the current active Safe address.
        const nextAccounts = eip155.chains?.map((c) => `${c}:${checksummed}`) ?? [account]
        await walletKit.updateSession({
          topic: session.topic,
          namespaces: {
            ...session.namespaces,
            [SUPPORTED_NAMESPACE]: { ...eip155, accounts: nextAccounts },
          },
        })

        // 2) Emit accountsChanged + chainChanged to the dApp.
        await walletKit.emitSessionEvent({
          topic: session.topic,
          event: { name: 'accountsChanged', data: [checksummed] },
          chainId: chainCaip2,
        })
        await walletKit.emitSessionEvent({
          topic: session.topic,
          event: { name: 'chainChanged', data: Number(activeSafe.chainId) },
          chainId: chainCaip2,
        })
      } catch (e) {
        console.log('[walletKit] active-safe binding failed for', session.topic, e)
      }
    })
  }, [walletKit, activeSafe?.address, activeSafe?.chainId, sessions])
}
