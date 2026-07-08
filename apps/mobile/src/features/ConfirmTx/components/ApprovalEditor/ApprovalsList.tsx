import React from 'react'
import { Text, Theme, XStack, YStack } from 'tamagui'
import { TokenType } from '@safe-global/store/gateway/types'
import {
  PSEUDO_APPROVAL_VALUES,
  type ApprovalInfo,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { TokenIcon } from '@/src/components/TokenIcon/TokenIcon'
import { Badge } from '@/src/components/Badge/Badge'
import { backdropOverlayBackground } from '@/src/components/Badge/theme'
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

const ApprovalItem = ({
  approval,
  onEdit,
}: {
  approval: ApprovalListItem
  onEdit?: (approval: ApprovalInfo) => void
}) => {
  return (
    <YStack gap="$4" testID="approval-item">
      <XStack justifyContent="space-between" alignItems="center" gap="$2">
        <Text color="$color" fontSize="$4">
          Amount
        </Text>
        <XStack gap="$2" alignItems="center" flexShrink={1}>
          <TokenIcon logoUri={approval.tokenInfo?.logoUri} size="$6" />
          <Badge
            circular={false}
            themeName={approval.isHighValue ? 'badge_warning_variant3' : 'badge_overlay'}
            textContentProps={{ fontWeight: 500 }}
            testID="approval-amount-pill"
            content={getAmountLabel(approval)}
          />
        </XStack>
      </XStack>

      <XStack justifyContent="space-between" alignItems="center" gap="$2">
        <Text color="$color" fontSize="$4">
          Spender
        </Text>
        <HashDisplay value={approval.spender} showExternalLink={false} textProps={{ color: '$textSecondaryLight' }} />
      </XStack>

      {onEdit && (
        <SafeButton
          secondary
          size="$sm"
          backgroundColor={backdropOverlayBackground}
          textColor="$staticPrimaryLight"
          testID="edit-approval-button"
          onPress={() => onEdit(approval)}
        >
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

/** Lists the approvals a dApp transaction grants, mirroring web's ApprovalEditor */
export const ApprovalsList = ({ approvals, onEdit }: ApprovalsListProps) => {
  // Like web's isReadOnly: an ERC-721 approval anywhere makes the whole card read-only
  const isErc721Approval = approvals.some((approval) => approval.tokenInfo?.type === TokenType.ERC721)
  const isReadOnly = !onEdit || isErc721Approval
  const subtitle = isErc721Approval
    ? 'This allows the spender to transfer the specified token.'
    : 'This approval lets the spender use your tokens, limited to this amount.'
  const hasHighValueApproval = approvals.some((approval) => approval.isHighValue)

  return (
    <Theme name={hasHighValueApproval ? 'approval_warning' : 'approval_info'}>
      <YStack
        backgroundColor="$background"
        borderRadius="$4"
        padding="$4"
        gap="$4"
        marginTop="$4"
        testID="approval-editor"
      >
        <YStack gap="$1">
          <XStack gap="$2" alignItems="center">
            <SafeFontIcon
              name={hasHighValueApproval ? 'alert' : 'info'}
              testID={hasHighValueApproval ? 'approval-editor-warning-icon' : 'approval-editor-info-icon'}
              color="$accent"
              size={24}
            />
            <Text fontSize="$5" fontWeight={700} color="$color">
              Allow access to tokens?
            </Text>
          </XStack>
          <Text fontSize="$4" color="$color" lineHeight={20}>
            {subtitle}
          </Text>
        </YStack>

        {approvals.map((approval, index) => (
          <ApprovalItem
            key={`${approval.tokenAddress}-${approval.transactionIndex}-${index}`}
            approval={approval}
            onEdit={isReadOnly ? undefined : onEdit}
          />
        ))}
      </YStack>
    </Theme>
  )
}
