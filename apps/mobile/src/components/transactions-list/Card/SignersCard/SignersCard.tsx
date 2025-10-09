import React, { useMemo } from 'react'
import { Text, View, type TextProps } from 'tamagui'
import { Identicon } from '@/src/components/Identicon'
import { BadgeWrapper } from '@/src/components/BadgeWrapper'
import { SafeListItem } from '@/src/components/SafeListItem'
import { EthAddress } from '@/src/components/EthAddress'
import { Address } from '@/src/types/address'
import { SignerTypeBadge } from '@/src/components/SignerTypeBadge'

type SignersCardProps = {
  name?: string | React.ReactNode
  address: `0x${string}`
  rightNode?: React.ReactNode
  transparent?: boolean
  balance?: string
  onPress?: () => void
  getSignerTag?: (address: Address) => string | undefined
}

const descriptionStyle: Partial<TextProps> = {
  fontSize: '$4',
  color: '$backgroundPress',
  fontWeight: 400,
}

const titleStyle: Partial<TextProps> = {
  fontSize: '$4',
  fontWeight: 600,
}

export function SignersCard({
  onPress,
  name,
  transparent = true,
  address,
  rightNode,
  getSignerTag,
  balance,
}: SignersCardProps) {
  const textProps = useMemo(() => {
    return name ? descriptionStyle : titleStyle
  }, [name])

  return (
    <SafeListItem
      onPress={onPress}
      transparent={transparent}
      label={
        <View>
          {name && (
            <View flexDirection="row" alignItems="center" gap="$2">
              {typeof name === 'string' ? (
                <Text fontSize="$4" fontWeight={600} {...titleStyle}>
                  {name}
                </Text>
              ) : React.isValidElement(name) ? (
                React.cloneElement(name as React.ReactElement<{ textProps?: Partial<TextProps> }>, {
                  textProps: titleStyle,
                })
              ) : (
                name
              )}
              {getSignerTag?.(address) && (
                <View
                  backgroundColor="$transparent"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$6"
                  borderWidth={1}
                  borderColor="$backgroundPress"
                >
                  <Text fontSize="$3" fontWeight={500}>
                    {getSignerTag?.(address)}
                  </Text>
                </View>
              )}
            </View>
          )}

          <EthAddress address={address} textProps={textProps} />
          {balance && (
            <View flexDirection="row" alignItems="center">
              <Text fontSize="$4" fontWeight={400} color="$colorSecondary">
                Balance:
              </Text>
              <Text fontSize="$4" fontWeight={400}>
                {' '}
                {balance}
              </Text>
            </View>
          )}
        </View>
      }
      leftNode={
        <View width="$10">
          <BadgeWrapper badge={<SignerTypeBadge address={address} theme="badge_background" />} position="bottom-right">
            <Identicon address={address} size={40} />
          </BadgeWrapper>
        </View>
      }
      rightNode={rightNode}
    />
  )
}

export default SignersCard
