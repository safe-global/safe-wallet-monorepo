import { useEffect } from 'react'
import { getSdkError } from '@walletconnect/utils'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { useStore } from 'react-redux'
import { useToastController } from '@tamagui/toast'
import { getEip155ChainId } from '@safe-global/utils/features/walletconnect/utils'
import { useAppDispatch } from '@/src/store/hooks'
import type { RootState } from '@/src/store'
import { pushPending } from '../store/walletKitSlice'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectChainById } from '@/src/store/chains'
import { collectNamespaceChains, isProposalSupported } from '../services/namespaces'
import { SUPPORTED_NAMESPACE } from '../services/constants'
import { logWalletKitError } from '../utils/errors'

// All eip155 chains the dApp can operate on — the union of its required and optional
// namespaces. buildApprovedNamespaces intersects this with the Safe's chains, so a chain
// the dApp never lists (whether required or optional) can never end up in the session.
const getDappSupportedChains = (proposal: WalletKitTypes.SessionProposal): Set<string> => {
  const { requiredNamespaces, optionalNamespaces } = proposal.params
  return new Set([...collectNamespaceChains(requiredNamespaces), ...collectNamespaceChains(optionalNamespaces ?? {})])
}

// Swallow stale-proposal errors from WalletKit (typical after a Metro reload / long
// backgrounding — the relayer reconnects and replays backlogged messages that reference
// proposals WalletKit no longer knows about). Surfacing these to LogBox is noise.
const safeRejectSession = async (
  walletKit: IWalletKit,
  args: Parameters<IWalletKit['rejectSession']>[0],
): Promise<void> => {
  try {
    await walletKit.rejectSession(args)
  } catch (e) {
    logWalletKitError('rejectSession failed', e)
  }
}

/**
 * Subscribes to `session_proposal` events and auto-rejects (no UI) proposals that are
 * fundamentally incompatible:
 *  - No active Safe selected
 *  - Required namespace key is not `eip155`
 *  - Required chains include chains the active Safe is not deployed on
 *  - The dApp does not support the active Safe's chain (with a toast, since the user
 *    can fix it by switching the active Safe to a network the dApp supports)
 *
 * Compatible proposals are pushed to the slice so RequestSheetHost renders
 * SessionProposalSheet.
 */
export const useSessionProposalHandler = (walletKit: IWalletKit | null) => {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const toast = useToastController()

  useEffect(() => {
    if (!walletKit) {
      return
    }
    const onProposal = async (proposal: WalletKitTypes.SessionProposal) => {
      const state = store.getState()
      const activeSafe = selectActiveSafe(state)

      // Auto-reject: no active Safe
      if (!activeSafe) {
        await safeRejectSession(walletKit, { id: proposal.id, reason: getSdkError('USER_REJECTED') })
        return
      }
      // Auto-reject: non-eip155 required namespace key
      if (!isProposalSupported(proposal.params)) {
        await safeRejectSession(walletKit, {
          id: proposal.id,
          reason: getSdkError('UNSUPPORTED_NAMESPACE_KEY'),
        })
        return
      }
      // Auto-reject: required chains the Safe isn't deployed on
      const safeDeployments = state.safes[activeSafe.address] ?? {}
      const supportedSet = new Set(Object.keys(safeDeployments).map((c) => `${SUPPORTED_NAMESPACE}:${c}`))
      const requiredChains = collectNamespaceChains(proposal.params.requiredNamespaces)
      const missing = requiredChains.find((c) => !supportedSet.has(c))
      if (missing) {
        await safeRejectSession(walletKit, {
          id: proposal.id,
          reason: getSdkError('UNSUPPORTED_CHAINS'),
        })
        return
      }
      // Auto-reject: the dApp doesn't support the active Safe's chain. buildApprovedNamespaces
      // would otherwise silently drop that chain and approve a session the active Safe can't
      // use at all (e.g. active Safe on Sepolia, dApp only on mainnet). Toast so the user knows
      // to switch the active Safe to a network the dApp supports.
      const activeChainCaip2 = getEip155ChainId(activeSafe.chainId)
      if (!getDappSupportedChains(proposal).has(activeChainCaip2)) {
        await safeRejectSession(walletKit, {
          id: proposal.id,
          reason: getSdkError('UNSUPPORTED_CHAINS'),
        })
        const dappName = proposal.params.proposer.metadata.name || 'This dApp'
        const networkName = selectChainById(state, activeSafe.chainId)?.chainName ?? `chain ${activeSafe.chainId}`
        toast.show(`${dappName} doesn't support network ${networkName}`, {
          native: false,
          duration: 3000,
          variant: 'error',
        })
        return
      }

      dispatch(pushPending({ kind: 'proposal', id: proposal.id, proposal }))
    }
    walletKit.on('session_proposal', onProposal)
    return () => {
      walletKit.off('session_proposal', onProposal)
    }
  }, [walletKit, dispatch, store, toast])
}

export const rejectProposal = async (walletKit: IWalletKit, id: number): Promise<void> => {
  await safeRejectSession(walletKit, { id, reason: getSdkError('USER_REJECTED') })
}
