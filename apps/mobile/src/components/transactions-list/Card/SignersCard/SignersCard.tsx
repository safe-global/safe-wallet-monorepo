import React, { useMemo } from 'react'
import { Text, View, type TextProps } from 'tamagui'
import { Identicon } from '@/src/components/Identicon'
import { SafeListItem } from '@/src/components/SafeListItem'
import { EthAddress } from '@/src/components/EthAddress'

type SignersCardProps = {
  name?: string
  address: `0x${string}`
  rightNode?: React.ReactNode
  transparent?: boolean
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

export function SignersCard({ name, transparent = true, address, rightNode }: SignersCardProps) {
  const textProps = useMemo(() => {
    return name ? descriptionStyle : titleStyle
  }, [name])

  return (
    <SafeListItem
      transparent={transparent}
      label={
        <View>
          {name && (
            <Text fontSize="$4" fontWeight={600}>
              {name}
            </Text>
          )}

          <EthAddress address={address} textProps={textProps} />
        </View>
      }
      leftNode={
        <View width="$10">
          <Identicon address={address} rounded size={40} />
        </View>
      }
      rightNode={rightNode}
    />
  )
}

export default SignersCard
