import React from 'react'
import { Text, XStack, YStack } from 'tamagui'
import { TokenType } from '@safe-global/store/gateway/types'
import {
  PSEUDO_APPROVAL_VALUES,
  type ApprovalInfo,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { Logo } from '@/src/components/Logo'
import { EthAddress } from '@/src/components/EthAddress'
import { SafeButton } from '@/src/components/SafeButton'
import type { Address } from '@/src/types/address'

export const isEditableApproval = (approval: ApprovalInfo): boolean =>
  approval.tokenInfo?.type === TokenType.ERC20 &&
  (approval.method === 'approve' || approval.method === 'increaseAllowance')

const ApprovalItem = ({ approval, onEdit }: { approval: ApprovalInfo; onEdit?: (approval: ApprovalInfo) => void }) => {
  const isUnlimited = approval.amountFormatted === PSEUDO_APPROVAL_VALUES.UNLIMITED

  return (
    <YStack gap="$3" testID="approval-item">
      <XStack justifyContent="space-between" alignItems="center" gap="$2">
        <Text color="$textSecondaryLight" fontSize="$4">
          Amount
        </Text>
        <XStack gap="$2" alignItems="center" flexShrink={1}>
          <Logo logoUri={approval.tokenInfo?.logoUri} size="$6" fallbackIcon="token" />
          <Text fontSize="$4" fontWeight={600} color={isUnlimited ? '$warning' : '$color'} flexShrink={1}>
            {isUnlimited ? 'Unlimited' : `${approval.amountFormatted} ${approval.tokenInfo?.symbol ?? ''}`.trim()}
          </Text>
        </XStack>
      </XStack>

      <XStack justifyContent="space-between" alignItems="center" gap="$2">
        <Text color="$textSecondaryLight" fontSize="$4">
          Spender
        </Text>
        <EthAddress address={approval.spender as Address} copy />
      </XStack>

      {onEdit && (
        <SafeButton secondary size="$sm" testID="edit-approval-button" onPress={() => onEdit(approval)}>
          Edit amount
        </SafeButton>
      )}
    </YStack>
  )
}

interface ApprovalsListProps {
  approvals: ApprovalInfo[]
  onEdit?: (approval: ApprovalInfo) => void
}

/**
 * Warning card listing every token approval a dApp transaction grants. Mirrors
 * the web ApprovalEditor copy; rows are editable only when the caller passes
 * onEdit and the approval can be re-encoded.
 */
export const ApprovalsList = ({ approvals, onEdit }: ApprovalsListProps) => {
  return (
    <YStack
      backgroundColor="$warningBackground"
      borderRadius="$4"
      padding="$4"
      gap="$4"
      marginTop="$4"
      testID="approval-editor"
    >
      <YStack gap="$1">
        <Text fontSize="$4" fontWeight={700}>
          Allow access to tokens?
        </Text>
        <Text fontSize="$3" color="$textSecondaryLight">
          This allows the spender to spend the specified amount of your tokens.
        </Text>
      </YStack>

      {approvals.map((approval, index) => (
        <ApprovalItem
          key={`${approval.tokenAddress}-${approval.transactionIndex}-${index}`}
          approval={approval}
          onEdit={onEdit && isEditableApproval(approval) ? onEdit : undefined}
        />
      ))}
    </YStack>
  )
}
