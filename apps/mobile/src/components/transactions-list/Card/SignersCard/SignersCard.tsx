import React from 'react'
import { Text, View } from 'tamagui'
import { Identicon } from '@/src/components/Identicon'
import { SafeListItem } from '@/src/components/SafeListItem'
import { EthAddress } from '@/src/components/EthAddress'

type SignersCardProps = {
  name: string
  address: `0x${string}`
  rightNode?: React.ReactNode
}

export function SignersCard({ name, address, rightNode }: SignersCardProps) {
  return (
    <SafeListItem
      transparent
      label={
        <View>
          <Text fontSize="$4" fontWeight={600}>
            {name}
          </Text>

          <EthAddress address={address} textProps={{ fontSize: '$4', color: '$backgroundPress', fontWeight: 400 }} />
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
