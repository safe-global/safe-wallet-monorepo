import { useCallback, useState } from 'react'
import { useStore } from 'react-redux'
import { useToastController } from '@tamagui/toast'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { useAppDispatch } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import type { RootState } from '@/src/store'
import { addSession, removePending } from '../store/walletKitSlice'
import { buildSafeApprovedNamespaces, buildSafeSessionProperties } from '../services/namespaces'
import { rejectProposal } from './useSessionProposalHandler'
import { logWalletKitError } from '../utils/errors'

type PendingProposal = { id: number; proposal: WalletKitTypes.SessionProposal }

/**
 * Approve flow for a session proposal: build eip155 namespaces from the active Safe's
 * deployments, call `approveSession`, and mirror the result into the slice. On any failure
 * (including a missing active Safe) it rejects so the dApp doesn't hang. Removing the pending
 * item clears the FIFO head, which dismisses the sheet.
 *
 * Reads the Safe state imperatively at approve-time (not via a selector) so the host doesn't
 * re-render on every unrelated store update.
 */
export const useApproveProposal = (walletKit: IWalletKit | null) => {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const toast = useToastController()
  const [busy, setBusy] = useState(false)

  const approve = useCallback(
    async (pending: PendingProposal) => {
      if (!walletKit) {
        return
      }
      const { id } = pending
      const state = store.getState()
      const activeSafe = selectActiveSafe(state)
      // Defensive: the handler already auto-rejects proposals with no active Safe; reaching
      // here means it was cleared between handler-time and Connect-tap.
      if (!activeSafe) {
        await rejectProposal(walletKit, id)
        dispatch(removePending({ id, kind: 'proposal' }))
        return
      }
      const supportedChains = Object.keys(state.safes[activeSafe.address] ?? {}).map((chainId) => ({ chainId }))
      try {
        setBusy(true)
        const namespaces = buildSafeApprovedNamespaces({
          proposal: pending.proposal.params,
          safeAddress: activeSafe.address,
          supportedChains,
        })
        // Signal atomic-batch support up front so dApps don't need wallet_getCapabilities first.
        const sessionProperties = buildSafeSessionProperties({ safeAddress: activeSafe.address, supportedChains })
        const session = await walletKit.approveSession({ id, namespaces, sessionProperties })
        dispatch(addSession(session))
        dispatch(removePending({ id, kind: 'proposal' }))
      } catch (e) {
        toast.show(e instanceof Error ? e.message : 'Failed to connect', { native: false, duration: 3000 })
        try {
          await rejectProposal(walletKit, id)
        } catch (rejectErr) {
          logWalletKitError('rejectProposal after approve failure also failed', rejectErr)
        }
        dispatch(removePending({ id, kind: 'proposal' }))
      } finally {
        setBusy(false)
      }
    },
    [walletKit, store, dispatch, toast],
  )

  return { approve, busy }
}
