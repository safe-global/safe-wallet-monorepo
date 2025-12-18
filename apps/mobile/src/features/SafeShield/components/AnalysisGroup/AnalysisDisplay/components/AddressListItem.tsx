import React from 'react'
import { Text, View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { TouchableOpacity } from 'react-native'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import { useDisplayName } from '@/src/hooks/useDisplayName'

interface AddressListItemProps {
  address: string
  index: number
  copiedIndex: number | null
  onCopy: (address: string, index: number) => void
  onOpenExplorer: (address: string) => void
  explorerLink?: ReturnType<typeof getExplorerLink>
}

export function AddressListItem({
  address,
  index,
  copiedIndex,
  onCopy,
  onOpenExplorer,
  explorerLink,
}: AddressListItemProps) {
  const { displayName } = useDisplayName({ value: address })

  return (
    <>
      {displayName && (
        <Text fontSize="$3" color="$color" marginBottom="$1">
          {displayName}
        </Text>
      )}

      <View flexDirection="row" alignItems="flex-start" gap="$2" flexWrap="wrap">
        <Text
          onPress={() => onCopy(address, index)}
          fontSize="$3"
          color={copiedIndex === index ? '$color' : '$colorLight'}
          flex={1}
          flexShrink={1}
        >
          {address}
        </Text>
        {explorerLink && (
          <TouchableOpacity
            onPress={() => onOpenExplorer(address)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ flexShrink: 0, transform: [{ translateY: 2 }] }}
          >
            <SafeFontIcon name="external-link" size={14} color="$colorLight" />
          </TouchableOpacity>
        )}
      </View>
    </>
  )
}
