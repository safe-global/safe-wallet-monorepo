import { useEffect } from 'react'
import type { IWalletKit } from '@reown/walletkit'
import type { SessionTypes } from '@walletconnect/types'
import { getAddress } from 'ethers'
import { EIP155 } from '@safe-global/utils/features/walletconnect/constants'
import { getEip155ChainId } from '@safe-global/utils/features/walletconnect/utils'
import { useAppSelector } from '@/src/store/hooks'
import { selectSessions } from '../store/walletKitSlice'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { logWalletKitError } from '../utils/errors'

export const useActiveSafeBinding = (walletKit: IWalletKit | null) => {
  const activeSafe = useAppSelector(selectActiveSafe)
  const sessions = useAppSelector(selectSessions)

  useEffect(() => {
    if (!walletKit || !activeSafe) {
      return
    }
    const checksummed = getAddress(activeSafe.address)
    const chainCaip2 = getEip155ChainId(activeSafe.chainId)

    // Redux's view of sessions can lag the SDK's after a delete / relay-driven prune.
    // Calling updateSession on a topic the SDK no longer knows throws "session topic
    // doesn't exist". Filter against the live snapshot to avoid the noisy call.
    const live = walletKit.getActiveSessions()

    const updateOne = async (session: SessionTypes.Struct) => {
      if (!live[session.topic]) {
        return
      }

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
    void Promise.all(sessions.map(updateOne))
  }, [walletKit, activeSafe?.address, activeSafe?.chainId, sessions])
}
