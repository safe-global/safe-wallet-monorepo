import React, { useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { Image, Text, YStack, XStack, Button } from 'tamagui'
import type { WalletKitTypes, IWalletKit } from '@reown/walletkit'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { addSession, removePending } from '../store/walletKitSlice'
import { buildSafeApprovedNamespaces, buildSafeSessionProperties } from '../services/namespaces'
import { verifyStatusToVariant } from '../utils/verifyStatus'
import { ConnectionPermissionsPanel } from './ConnectionPermissionsPanel'
import { rejectProposal } from '../hooks/useSessionProposalHandler'

type Props = {
  walletKit: IWalletKit
  pending: { id: number; proposal: WalletKitTypes.SessionProposal }
}

export const SessionProposalSheet: React.FC<Props> = ({ walletKit, pending }) => {
  const dispatch = useAppDispatch()
  const activeSafe = useAppSelector(selectActiveSafe)
  // Chains the Safe is deployed on, in the SupportedChain[] shape buildSafeApprovedNamespaces expects.
  const supportedChains = useAppSelector((s) =>
    activeSafe ? Object.keys(s.safes[activeSafe.address] ?? {}).map((chainId) => ({ chainId })) : [],
  )
  const [busy, setBusy] = useState(false)

  const { proposer } = pending.proposal.params
  const verifyContext = pending.proposal.verifyContext
  const variant = useMemo(() => verifyStatusToVariant(verifyContext?.verified), [verifyContext])

  const close = () => dispatch(removePending({ id: pending.id, kind: 'proposal' }))

  const onConnect = async () => {
    // Defensive fallback only — the handler in Task 3.1 has already auto-rejected proposals
    // that are missing an active Safe or have unsupported namespaces. Reaching this branch
    // means the active Safe was cleared between handler-time and Connect-tap.
    if (!activeSafe) {
      await rejectProposal(walletKit, pending.id)
      close()
      return
    }
    try {
      setBusy(true)
      const namespaces = buildSafeApprovedNamespaces({
        proposal: pending.proposal.params,
        safeAddress: activeSafe.address,
        supportedChains,
      })
      // Signal atomic-batch support up front so dApps don't need to call
      // wallet_getCapabilities to discover it. Mirrors the web wallet's pattern.
      const sessionProperties = buildSafeSessionProperties({
        safeAddress: activeSafe.address,
        supportedChains,
      })
      const session = await walletKit.approveSession({
        id: pending.id,
        namespaces,
        sessionProperties,
      })
      dispatch(addSession(session))
      close()
    } catch (e) {
      Alert.alert('Failed to connect', e instanceof Error ? e.message : 'Unknown error')
      // Always reject on failure so the dApp doesn't hang waiting for a response.
      try {
        await rejectProposal(walletKit, pending.id)
      } catch (rejectErr) {
        console.log('[walletKit] rejectProposal after approve failure also failed', rejectErr)
      }
      close()
    } finally {
      setBusy(false)
    }
  }

  const onReject = async () => {
    await rejectProposal(walletKit, pending.id)
    close()
  }

  const meta = proposer.metadata

  return (
    <YStack gap="$4" padding="$4">
      <XStack gap="$3" alignItems="center">
        {meta.icons?.[0] ? (
          <Image source={{ uri: meta.icons[0] }} width={48} height={48} borderRadius="$2" />
        ) : (
          <YStack width={48} height={48} borderRadius="$2" backgroundColor="$backgroundSecondary" />
        )}
        <YStack flex={1}>
          <Text fontWeight="600">{meta.name}</Text>
          <Text color="$colorSecondary" numberOfLines={1}>
            {meta.url}
          </Text>
        </YStack>
      </XStack>
      <ConnectionPermissionsPanel variant={variant} />
      <XStack gap="$3">
        <Button flex={1} height="$8" borderWidth={1} onPress={onReject} disabled={busy}>
          Reject
        </Button>
        <Button flex={1} height="$8" onPress={onConnect} disabled={busy}>
          {busy ? 'Connecting…' : 'Connect'}
        </Button>
      </XStack>
    </YStack>
  )
}
