import { useEffect } from 'react'
import type { IWalletKit } from '@reown/walletkit'
import type { SessionTypes } from '@walletconnect/types'
import { getAddress } from 'ethers'
import { EIP155 } from '@safe-global/utils/features/walletconnect/constants'
import { getEip155ChainId } from '@safe-global/utils/features/walletconnect/utils'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { logWalletKitError } from '../utils/errors'

export const useActiveSafeBinding = (walletKit: IWalletKit | null) => {
  const activeSafe = useAppSelector(selectActiveSafe)

  useEffect(() => {
    if (!walletKit || !activeSafe) {
      return
    }
    const checksummed = getAddress(activeSafe.address)
    const chainCaip2 = getEip155ChainId(activeSafe.chainId)

    // Source sessions from the SDK's live snapshot, not the redux mirror. A new session is
    // already bound to the active Safe at approval time, so this effect only needs to re-bind
    // when the active Safe itself changes (address / chain) — see the deps. Depending on the
    // sessions array instead would re-emit updateSession + accountsChanged/chainChanged to
    // every connected dApp on any single-session add/remove (redundant O(n) churn). Reading
    // the live snapshot also avoids updateSession throwing on a topic the SDK already pruned.
    const live = walletKit.getActiveSessions()

    const updateOne = async (session: SessionTypes.Struct) => {
      const eip155 = session.namespaces[EIP155]
      if (!eip155) {
        return
      }

      // The active Safe can move to a chain this session never approved. WalletConnect
      // can't represent that — emitSessionEvent rejects a chainId outside the session
      // namespaces — so skip update + emit and leave the dApp on its last supported chain.
      const sessionChains = eip155.chains ?? []
      if (!sessionChains.includes(chainCaip2)) {
        return
      }

      try {
        const nextAccounts = sessionChains.map((c) => `${c}:${checksummed}`)
        await walletKit.updateSession({
          topic: session.topic,
          namespaces: {
            ...session.namespaces,
            [EIP155]: { ...eip155, accounts: nextAccounts },
          },
        })

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
        logWalletKitError(`active-safe binding failed for ${session.topic}`, e)
      }
    }

    // Each body catches its own errors, so Promise.all never rejects — the explicit void
    // documents the fire-and-forget intent.
    void Promise.all(Object.values(live).map(updateOne))
  }, [walletKit, activeSafe?.address, activeSafe?.chainId])
}
