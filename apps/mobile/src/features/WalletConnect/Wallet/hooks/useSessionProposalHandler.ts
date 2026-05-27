import { useEffect } from 'react'
import { getSdkError } from '@walletconnect/utils'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { useStore } from 'react-redux'
import { useAppDispatch } from '@/src/store/hooks'
import type { RootState } from '@/src/store'
import { pushPending } from '../store/walletKitSlice'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { isProposalSupported } from '../services/namespaces'
import { SUPPORTED_NAMESPACE } from '../services/constants'

/**
 * Subscribes to `session_proposal` events and auto-rejects (no UI) proposals that are
 * fundamentally incompatible:
 *  - No active Safe selected
 *  - Required namespace key is not `eip155`
 *  - Required chains include chains the active Safe is not deployed on
 *
 * Compatible proposals are pushed to the slice so RequestSheetHost renders
 * SessionProposalSheet.
 */
export const useSessionProposalHandler = (walletKit: IWalletKit | null) => {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()

  useEffect(() => {
    if (!walletKit) {
      return
    }
    const onProposal = async (proposal: WalletKitTypes.SessionProposal) => {
      const state = store.getState()
      const activeSafe = selectActiveSafe(state)

      // Auto-reject: no active Safe
      if (!activeSafe) {
        await walletKit.rejectSession({ id: proposal.id, reason: getSdkError('USER_REJECTED') })
        return
      }
      // Auto-reject: non-eip155 required namespace key
      if (!isProposalSupported(proposal.params)) {
        await walletKit.rejectSession({
          id: proposal.id,
          reason: getSdkError('UNSUPPORTED_NAMESPACE_KEY'),
        })
        return
      }
      // Auto-reject: required chains the Safe isn't deployed on
      const safeDeployments = state.safes[activeSafe.address] ?? {}
      const supportedSet = new Set(Object.keys(safeDeployments).map((c) => `${SUPPORTED_NAMESPACE}:${c}`))
      const requiredChains = Object.values(proposal.params.requiredNamespaces).flatMap((ns) => ns.chains ?? [])
      const missing = requiredChains.find((c) => !supportedSet.has(c))
      if (missing) {
        await walletKit.rejectSession({
          id: proposal.id,
          reason: getSdkError('UNSUPPORTED_CHAINS'),
        })
        return
      }

      dispatch(pushPending({ kind: 'proposal', id: proposal.id, proposal }))
    }
    walletKit.on('session_proposal', onProposal)
    return () => {
      walletKit.off('session_proposal', onProposal)
    }
  }, [walletKit, dispatch, store])
}

export const rejectProposal = async (walletKit: IWalletKit, id: number): Promise<void> => {
  await walletKit.rejectSession({ id, reason: getSdkError('USER_REJECTED') })
}
