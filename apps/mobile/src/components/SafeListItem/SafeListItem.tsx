import React from 'react'
import { Container } from '../Container'
import { Text, Theme, ThemeName, View, ViewProps, YStackProps } from 'tamagui'
import { IconProps, SafeFontIcon } from '../SafeFontIcon/SafeFontIcon'
import { ellipsis } from '@/src/utils/formatters'
import { isMultisigExecutionInfo } from '@/src/utils/transaction-guards'
import { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Badge } from '../Badge'
import { Tag } from '../Tag'
import { ProposalBadge } from '../ProposalBadge'

export interface SafeListItemProps {
  type?: string
  label: string | React.ReactNode
  icon?: IconProps['name']
  children?: React.ReactNode
  rightNode?: React.ReactNode
  leftNode?: React.ReactNode
  bordered?: boolean
  transparent?: boolean
  spaced?: boolean
  inQueue?: boolean
  executionInfo?: Transaction['executionInfo']
  themeName?: ThemeName
  onPress?: () => void
  tag?: string
  paddingVertical?: YStackProps['paddingVertical']
  bottomContent?: React.ReactNode
  pressStyle?: ViewProps['pressStyle']
}

export function SafeListItem({
  type,
  leftNode,
  icon,
  bordered,
  spaced,
  label,
  transparent,
  rightNode,
  children,
  inQueue,
  executionInfo,
  themeName,
  onPress,
  tag,
  paddingVertical = '$4',
  bottomContent,
  pressStyle,
}: SafeListItemProps) {
  // TODO: Replace this with proposedByDelegate once EN-149 is implemented
  const isProposedTx = isMultisigExecutionInfo(executionInfo) ? executionInfo.confirmationsSubmitted === 0 : false

  return (
    <Container
      spaced={spaced}
      bordered={bordered}
      gap={12}
      onPress={onPress}
      transparent={transparent}
      themeName={themeName}
      alignItems={'flex-start'}
      flexWrap="wrap"
      flexDirection="column"
      justifyContent="flex-start"
      paddingVertical={paddingVertical}
      // If just set pressStyle to undefined, then the onPress doesn't work, that's why we need this hack
      {...(pressStyle ? { pressStyle } : {})}
    >
      <View flexDirection="row" width="100%" alignItems="center" justifyContent="space-between">
        <View flexDirection="row" maxWidth={rightNode ? '55%' : '100%'} alignItems="center" gap={12}>
          {leftNode}

          <View>
            {type && (
              <View flexDirection="row" alignItems="center" gap={4}>
                {icon && (
                  <SafeFontIcon testID={`safe-list-${icon}-icon`} name={icon} size={10} color="$colorSecondary" />
                )}
                <Text fontSize="$2" lineHeight={20} color="$colorSecondary">
                  {type}
                </Text>
              </View>
            )}

            {typeof label === 'string' ? (
              <Text fontSize="$4" lineHeight={20} fontWeight={600} letterSpacing={-0.01}>
                {ellipsis(label, rightNode || inQueue ? 21 : 30)}
              </Text>
            ) : (
              label
            )}
          </View>
          {tag && <Tag>{tag}</Tag>}
        </View>

        {inQueue && executionInfo && isMultisigExecutionInfo(executionInfo) ? (
          <View alignItems="center" flexDirection="row" gap="$2">
            {isProposedTx ? (
              <ProposalBadge />
            ) : (
              <Badge
                circleProps={{ paddingHorizontal: 8, paddingVertical: 2 }}
                circular={false}
                content={
                  <View alignItems="center" flexDirection="row" gap="$1">
                    <SafeFontIcon size={12} name="owners" />

                    <Text fontWeight={600} color={'$color'} fontSize="$2" lineHeight={18}>
                      {executionInfo?.confirmationsSubmitted}/{executionInfo?.confirmationsRequired}
                    </Text>
                  </View>
                }
                themeName={
                  executionInfo?.confirmationsRequired === executionInfo?.confirmationsSubmitted
                    ? 'badge_success_variant1'
                    : 'badge_warning'
                }
              />
            )}

            <SafeFontIcon name="chevron-right" size={16} />
          </View>
        ) : (
          rightNode
        )}
      </View>

      {bottomContent && (
        <View width="100%" marginTop="$3">
          {bottomContent}
        </View>
      )}

      {children}
    </Container>
  )
}

SafeListItem.Header = function Header({ title }: { title: string }) {
  return (
    <Theme name="safe_list">
      <View paddingVertical="$4" backgroundColor={'$background'}>
        <Text fontWeight={500} color="$colorSecondary">
          {title}
        </Text>
      </View>
    </Theme>
  )
}
