import React from 'react'
import { Loader } from '@/src/components/Loader'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Text, View } from 'tamagui'
import { ProposalBadge } from '@/src/components/ProposalBadge'
import type { MultisigExecutionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTransactionSigningState } from '@/src/hooks/useTransactionSigningState'

interface SigningStateProps {
  txId: string
  executionInfo: MultisigExecutionInfo
  isProposedTx: boolean
}

/**
 * Displays the signing state for a transaction in the pending transactions list.
 *
 * Shows either:
 * - A loading spinner while signing is in progress (entire flow, not just API call)
 * - The confirmation badge showing X/Y signers
 */
export function SigningState({ txId, executionInfo, isProposedTx }: SigningStateProps) {
  // Use global signing state to determine if this transaction is being signed
  const { isSigning } = useTransactionSigningState(txId)

  if (isSigning) {
    return <Loader size={20} testID="signing-state-loader" />
  }

  if (isProposedTx) {
    return <ProposalBadge />
  }

  return (
    <Badge
      circleProps={{ paddingHorizontal: 8, paddingVertical: 2 }}
      circular={false}
      content={
        <View alignItems="center" flexDirection="row" gap="$1">
          <SafeFontIcon size={12} name="owners" />
          <Text fontWeight={600} color={'$color'} fontSize="$2" lineHeight={18}>
            {executionInfo.confirmationsSubmitted}/{executionInfo.confirmationsRequired}
          </Text>
        </View>
      }
      themeName={
        executionInfo.confirmationsRequired === executionInfo.confirmationsSubmitted
          ? 'badge_success_variant1'
          : 'badge_warning'
      }
    />
  )
}
