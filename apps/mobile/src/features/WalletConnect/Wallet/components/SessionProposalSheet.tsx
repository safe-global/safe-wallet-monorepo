import React, { useMemo, useState } from 'react'
import { Text, YStack, XStack } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import type { WalletKitTypes, IWalletKit } from '@reown/walletkit'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { DappIcon } from './DappIcon'
import { VerifyStatusIcon } from './VerifyStatusIcon'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { addSession, removePending } from '../store/walletKitSlice'
import { buildSafeApprovedNamespaces, buildSafeSessionProperties } from '../services/namespaces'
import { verifyStatusToVariant } from '../utils/verifyStatus'
import { ConnectionPermissionsPanel } from './ConnectionPermissionsPanel'
import { rejectProposal } from '../hooks/useSessionProposalHandler'
import { logWalletKitError } from '../utils/errors'

type Props = {
  walletKit: IWalletKit
  pending: { id: number; proposal: WalletKitTypes.SessionProposal }
  // Lets the host resize the bottom sheet (the permissions panel is taller than the main state).
  onPermissionsOpenChange?: (open: boolean) => void
}

export const SessionProposalSheet: React.FC<Props> = ({ walletKit, pending, onPermissionsOpenChange }) => {
  const dispatch = useAppDispatch()
  const toast = useToastController()
  const activeSafe = useAppSelector(selectActiveSafe)
  // Chains the Safe is deployed on, in the SupportedChain[] shape buildSafeApprovedNamespaces expects.
  const supportedChains = useAppSelector((s) =>
    activeSafe ? Object.keys(s.safes[activeSafe.address] ?? {}).map((chainId) => ({ chainId })) : [],
  )
  const [busy, setBusy] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)

  const { proposer } = pending.proposal.params
  const verifyContext = pending.proposal.verifyContext
  const variant = useMemo(() => verifyStatusToVariant(verifyContext?.verified), [verifyContext])

  const meta = proposer.metadata
  // dApp domain without the scheme/trailing slash, e.g. 'https://uniswap.org/' -> 'uniswap.org'.
  const domain = useMemo(() => meta.url?.replace(/^https?:\/\//, '').replace(/\/+$/, '') || meta.url || '', [meta.url])

  const close = () => dispatch(removePending({ id: pending.id, kind: 'proposal' }))

  const openPermissions = () => {
    setShowPermissions(true)
    onPermissionsOpenChange?.(true)
  }
  const closePermissions = () => {
    setShowPermissions(false)
    onPermissionsOpenChange?.(false)
  }

  const onConnect = async () => {
    // Defensive fallback only — the handler has already auto-rejected proposals missing an
    // active Safe or with unsupported namespaces. Reaching this branch means the active Safe
    // was cleared between handler-time and Connect-tap.
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
      toast.show(e instanceof Error ? e.message : 'Failed to connect', { native: false, duration: 3000 })
      // Always reject on failure so the dApp doesn't hang waiting for a response.
      try {
        await rejectProposal(walletKit, pending.id)
      } catch (rejectErr) {
        logWalletKitError('rejectProposal after approve failure also failed', rejectErr)
      }
      close()
    } finally {
      setBusy(false)
    }
  }

  // The info symbol on the domain pill opens the permissions detail; "Got it" returns here.
  if (showPermissions) {
    return <ConnectionPermissionsPanel variant={variant} onDismiss={closePermissions} />
  }

  return (
    <YStack gap="$5" padding="$4">
      <Text fontSize={18} fontWeight="600" textAlign="center">
        Connection request
      </Text>

      <YStack gap="$3" alignItems="center">
        <YStack width={64} height={64}>
          <DappIcon url={meta.icons?.[0]} size={64} />
          {/* Verify badge overlapping the icon's bottom-right corner. The $background ring
              separates the badge from the dApp icon, matching the design. */}
          <YStack position="absolute" bottom={-4} right={-4} borderRadius={100} backgroundColor="$background">
            <VerifyStatusIcon variant={variant} size={22} onPress={openPermissions} />
          </YStack>
        </YStack>

        <Text fontSize={17} fontWeight="600" textAlign="center">
          {meta.name}
        </Text>

        <XStack
          gap="$1"
          alignItems="center"
          paddingVertical="$1"
          paddingHorizontal="$2"
          borderRadius="$2"
          backgroundColor="$backgroundSecondary"
          pressStyle={{ opacity: 0.6 }}
          onPress={openPermissions}
          testID="wc-proposal-domain"
        >
          <Text color="$colorSecondary">{domain}</Text>
          <SafeFontIcon name="info" size={14} color="$colorSecondary" />
        </XStack>
      </YStack>

      <SafeButton primary onPress={onConnect} loading={busy} loadingText="Connecting…" testID="wc-proposal-connect">
        Connect
      </SafeButton>
    </YStack>
  )
}
