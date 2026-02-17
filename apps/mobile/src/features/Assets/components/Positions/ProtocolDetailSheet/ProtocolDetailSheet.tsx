import React from 'react'
import { Text, View } from 'tamagui'
import { PositionItem } from '../PositionItem'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

interface ProtocolDetailSheetPositionsProps {
  protocol: Protocol
  currency: string
}

export const ProtocolDetailSheetPositions = ({ protocol, currency }: ProtocolDetailSheetPositionsProps) => {
  const { items } = protocol

  return (
    <View paddingHorizontal="$2" width="100%">
      {items.map((group, groupIndex) => (
        <View
          key={`${group.name}-${groupIndex}`}
          backgroundColor="$backgroundPaper"
          borderRadius="$3"
          marginBottom="$2"
          padding="$3"
        >
          <Text fontSize={20} fontWeight={600} color="$color" lineHeight={26}>
            {group.name}
          </Text>
          <View height={1} backgroundColor="$borderLight" marginVertical="$3" />
          {group.items.map((position, positionIndex) => (
            <PositionItem
              key={`${position.tokenInfo.address}-${positionIndex}`}
              position={position}
              currency={currency}
            />
          ))}
        </View>
      ))}
    </View>
  )
}
