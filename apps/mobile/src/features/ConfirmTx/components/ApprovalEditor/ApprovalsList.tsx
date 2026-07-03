import React from 'react'
import { Text, View, XStack, YStack } from 'tamagui'
import { TokenType } from '@safe-global/store/gateway/types'
import {
  PSEUDO_APPROVAL_VALUES,
  type ApprovalInfo,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { TokenIcon } from '@/src/components/TokenIcon/TokenIcon'
import { Badge } from '@/src/components/Badge/Badge'
import { HashDisplay } from '@/src/components/HashDisplay'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'

const getAmountLabel = (approval: ApprovalInfo): string => {
  if (approval.amountFormatted === PSEUDO_APPROVAL_VALUES.UNLIMITED) {
    return 'Unlimited'
  }
  const symbol = approval.tokenInfo?.symbol ?? ''
  // NFT approvals carry a token id, not an amount
  if (approval.tokenInfo?.type === TokenType.ERC721) {
    return `#${approval.amount} ${symbol}`.trim()
  }
  return `${approval.amountFormatted} ${symbol}`.trim()
}

const ApprovalItem = ({ approval, onEdit }: { approval: ApprovalInfo; onEdit?: (approval: ApprovalInfo) => void }) => {
  const isUnlimited = approval.amountFormatted === PSEUDO_APPROVAL_VALUES.UNLIMITED

  return (
    <YStack gap="$3" testID="approval-item">
      <XStack justifyContent="space-between" alignItems="center" gap="$2">
        <Text color="$textSecondaryLight" fontSize="$4">
          Amount
        </Text>
        <XStack gap="$2" alignItems="center" flexShrink={1}>
          <TokenIcon logoUri={approval.tokenInfo?.logoUri} size="$6" />
          <Badge
            circular={false}
            themeName={isUnlimited ? 'badge_warning_variant2' : 'badge_background'}
            textContentProps={{ fontWeight: 600 }}
            testID="approval-amount-pill"
            content={getAmountLabel(approval)}
          />
        </XStack>
      </XStack>

      <XStack justifyContent="space-between" alignItems="center" gap="$2">
        <Text color="$textSecondaryLight" fontSize="$4">
          Spender
        </Text>
        <HashDisplay value={approval.spender} />
      </XStack>

      {onEdit && (
        <SafeButton secondary size="$sm" testID="edit-approval-button" onPress={() => onEdit(approval)}>
          Edit amount
        </SafeButton>
      )}
    </YStack>
  )
}

export type ApprovalListItem = ApprovalInfo & {
  /** Unlimited or high-value approvals render the card with warning emphasis */
  isHighValue?: boolean
}

interface ApprovalsListProps {
  approvals: ApprovalListItem[]
  onEdit?: (approval: ApprovalInfo) => void
}

/**
 * Card listing the token approvals a dApp transaction grants, mirroring the
 * web ApprovalEditor (apps/web/src/components/tx/ApprovalEditor). Unlimited or
 * high-value approvals use the warning palette, everything else info.
 */
export const ApprovalsList = ({ approvals, onEdit }: ApprovalsListProps) => {
  // Like web's isReadOnly: an ERC-721 approval anywhere makes the whole card read-only
  const isErc721Approval = approvals.some((approval) => approval.tokenInfo?.type === TokenType.ERC721)
  const isReadOnly = !onEdit || isErc721Approval
  const subtitle = isErc721Approval
    ? 'This allows the spender to transfer the specified token.'
    : 'This allows the spender to spend the specified amount of your tokens.'
  const hasHighValueApproval = approvals.some((approval) => approval.isHighValue)

  return (
    <YStack
      backgroundColor={hasHighValueApproval ? '$backgroundWarning' : '$infoBackground'}
      borderRadius="$4"
      padding="$4"
      gap="$4"
      marginTop="$4"
      testID="approval-editor"
    >
      <YStack gap="$2">
        <XStack gap="$2" alignItems="center">
          <View backgroundColor={hasHighValueApproval ? '$warning' : '$info'} borderRadius="$10" padding="$1">
            <SafeFontIcon
              name={hasHighValueApproval ? 'alert' : 'info'}
              testID={hasHighValueApproval ? 'approval-editor-warning-icon' : 'approval-editor-info-icon'}
              color="$colorContrast"
              size={16}
            />
          </View>
          <Text fontSize="$4" fontWeight={700}>
            Allow access to tokens?
          </Text>
        </XStack>
        <Text fontSize="$3">{subtitle}</Text>
      </YStack>

      {approvals.map((approval, index) => (
        <ApprovalItem
          key={`${approval.tokenAddress}-${approval.transactionIndex}-${index}`}
          approval={approval}
          onEdit={isReadOnly ? undefined : onEdit}
        />
      ))}
    </YStack>
  )
}
