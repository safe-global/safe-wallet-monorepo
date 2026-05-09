import React, { useReducer } from 'react'
import { Text } from 'tamagui'
import { TouchableOpacity } from 'react-native'

interface EncodedDataProps {
  data: string
}

export function EncodedData({ data }: EncodedDataProps) {
  const [truncated, toggleTruncate] = useReducer((state: boolean) => !state, true)

  return (
    <>
      <Text numberOfLines={truncated ? 5 : undefined} ellipsizeMode="tail">
        {data}
      </Text>

      <TouchableOpacity onPress={toggleTruncate}>
        <Text fontWeight={600}>{truncated ? 'Show more' : 'Show less'}</Text>
      </TouchableOpacity>
    </>
  )
}
