import React, { useMemo } from 'react'
import { Text, YStack, XStack } from 'tamagui'
import type { WalletKitTypes } from '@reown/walletkit'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { DappIcon } from './DappIcon'
import { VerifyStatusIcon } from './VerifyStatusIcon'
import { verifyStatusToVariant } from '../utils/verifyStatus'

type Props = {
  pending: { id: number; proposal: WalletKitTypes.SessionProposal }
  // Asks the host to swap in the permissions panel (rendered by RequestSheetHost so its CTA
  // can be pinned to the sheet's bottom edge as a BottomSheetFooter).
  onOpenPermissions?: () => void
}

// Presentation only — the "Connect" CTA is rendered by RequestSheetHost as a pinned
// BottomSheetFooter (alongside the permissions panel's "Got it"), so both sit flush at the
// bottom edge of the sheet regardless of content height.
export const SessionProposalSheet: React.FC<Props> = ({ pending, onOpenPermissions }) => {
  const { proposer } = pending.proposal.params
  const verifyContext = pending.proposal.verifyContext
  const variant = useMemo(() => verifyStatusToVariant(verifyContext?.verified), [verifyContext])

  const meta = proposer.metadata
  // dApp domain without the scheme/trailing slash, e.g. 'https://uniswap.org/' -> 'uniswap.org'.
  const domain = useMemo(() => meta.url?.replace(/^https?:\/\//, '').replace(/\/+$/, '') || meta.url || '', [meta.url])

  return (
    <YStack gap="$5" padding="$4">
      <Text fontSize={20} fontWeight="600" letterSpacing={-0.2} textAlign="center">
        Connection request
      </Text>

      <YStack gap="$3" alignItems="center">
        <YStack width={64} height={64}>
          <DappIcon url={meta.icons?.[0]} size={64} />
          {/* Verify badge overlapping the icon's bottom-right corner. The $background ring
              separates the badge from the dApp icon, matching the design. */}
          <YStack position="absolute" bottom={-4} right={-4} borderRadius={100} backgroundColor="$background">
            <VerifyStatusIcon variant={variant} size={22} onPress={onOpenPermissions} />
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
          borderRadius="$8"
          backgroundColor="$backgroundSecondary"
          pressStyle={{ opacity: 0.6 }}
          onPress={onOpenPermissions}
          testID="wc-proposal-domain"
        >
          <Text color="$colorSecondary">{domain}</Text>
          <SafeFontIcon name="info" size={14} color="$colorSecondary" />
        </XStack>
      </YStack>
    </YStack>
  )
}
