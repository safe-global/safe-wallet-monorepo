import React from 'react'
import { Text, View, XStack, YStack } from 'tamagui'
import { TokenType } from '@safe-global/store/gateway/types'
import {
  PSEUDO_APPROVAL_VALUES,
  type ApprovalInfo,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { Logo } from '@/src/components/Logo'
import { Badge } from '@/src/components/Badge/Badge'
import { EthAddress } from '@/src/components/EthAddress'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
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
          <Badge
            circular={false}
            themeName={isUnlimited ? 'badge_warning_variant2' : 'badge_warning'}
            textContentProps={{ fontWeight: 600 }}
            testID="approval-amount-pill"
            content={
              isUnlimited ? 'Unlimited' : `${approval.amountFormatted} ${approval.tokenInfo?.symbol ?? ''}`.trim()
            }
          />
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
      backgroundColor="$backgroundWarning"
      borderRadius="$4"
      padding="$4"
      gap="$4"
      marginTop="$4"
      testID="approval-editor"
    >
      <YStack gap="$2">
        <XStack gap="$2" alignItems="center">
          <View backgroundColor="$warning" borderRadius="$10" padding="$1">
            <SafeFontIcon name="alert" color="$colorContrast" size={16} />
          </View>
          <Text fontSize="$4" fontWeight={700}>
            Allow access to tokens?
          </Text>
        </XStack>
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
