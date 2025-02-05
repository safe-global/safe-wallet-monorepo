import React from 'react'
import { Container } from '../Container'
import { Text, Theme, ThemeName, View } from 'tamagui'
import { IconProps, SafeFontIcon } from '../SafeFontIcon/SafeFontIcon'
import { ellipsis } from '@/src/utils/formatters'
import { isMultisigExecutionInfo } from '@/src/utils/transaction-guards'
import { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Badge } from '../Badge'

interface SafeListItemProps {
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
}: SafeListItemProps) {
  return (
    <Container
      spaced={spaced}
      bordered={bordered}
      gap={12}
      transparent={transparent}
      themeName={themeName}
      alignItems={'center'}
      flexWrap="wrap"
      flexDirection="row"
      justifyContent="space-between"
    >
      <View flexDirection="row" maxWidth={rightNode ? '55%' : '100%'} alignItems="center" gap={12}>
        {leftNode}

        <View>
          {type && (
            <View flexDirection="row" alignItems="center" gap={4} marginBottom={4}>
              {icon && <SafeFontIcon testID={`safe-list-${icon}-icon`} name={icon} size={10} color="$colorSecondary" />}
              <Text fontSize="$3" color="$colorSecondary" marginBottom={2}>
                {type}
              </Text>
            </View>
          )}

          {typeof label === 'string' ? (
            <Text fontSize="$4" fontWeight={600}>
              {ellipsis(label, rightNode ? 21 : 30)}
            </Text>
          ) : (
            label
          )}
        </View>
      </View>

      {inQueue && executionInfo && isMultisigExecutionInfo(executionInfo) ? (
        <View alignItems="center" flexDirection="row">
          <Badge
            circular={false}
            content={
              <View alignItems="center" flexDirection="row" gap="$1">
                <SafeFontIcon size={12} name="owners" />

                <Text fontWeight={600} color={'$color'}>
                  {executionInfo?.confirmationsSubmitted}/{executionInfo?.confirmationsRequired}
                </Text>
              </View>
            }
            themeName={
              executionInfo?.confirmationsRequired === executionInfo?.confirmationsSubmitted
                ? 'badge_success_variant1'
                : 'badge_warning_variant1'
            }
          />

          <SafeFontIcon name="arrow-right" />
        </View>
      ) : (
        rightNode
      )}

      {children}
    </Container>
  )
}

SafeListItem.Header = function Header({ title }: { title: string }) {
  return (
    <Theme name="safe_list">
      <View paddingVertical="$4" paddingHorizontal="$3" backgroundColor={'$background'}>
        <Text fontWeight={500} color="$colorSecondary">
          {title}
        </Text>
      </View>
    </Theme>
  )
}
