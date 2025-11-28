import React from 'react'
import type { MasterCopyChangeThreatAnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { Text, View, Stack } from 'tamagui'

interface AddressChangesProps {
  result: MasterCopyChangeThreatAnalysisResult
}

export function AddressChanges({ result }: AddressChangesProps) {
  if (!result.before || !result.after) {
    return null
  }

  const items = [
    {
      label: 'CURRENT MASTERCOPY:',
      value: result.before,
    },
    {
      label: 'NEW MASTERCOPY:',
      value: result.after,
    },
  ]

  return (
    <Stack gap="$2">
      {items.map((item, index) => (
        <View
          key={`${item.value}-${index}`}
          padding="$2"
          backgroundColor="$background"
          borderRadius="$1"
          gap="$1"
          overflow="hidden"
        >
          <Text letterSpacing={1} fontSize="$3" color="$colorSecondary">
            {item.label}
          </Text>
          <Text fontSize="$4" style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
            {item.value}
          </Text>
        </View>
      ))}
    </Stack>
  )
}
