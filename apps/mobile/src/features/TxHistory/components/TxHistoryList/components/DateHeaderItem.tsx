import React from 'react'
import { View, Text } from 'tamagui'
import { formatWithSchema } from '@/src/utils/date'

interface DateHeaderItemProps {
  timestamp: number
}

const DateHeaderItemComponent = ({ timestamp }: DateHeaderItemProps) => {
  const dateTitle = formatWithSchema(timestamp, 'MMM d, yyyy')

  return (
    <View marginTop="$2" backgroundColor="$background" paddingTop="$2">
      <Text fontWeight={500} color="$colorSecondary">
        {dateTitle}
      </Text>
    </View>
  )
}

export const DateHeaderItem = React.memo(DateHeaderItemComponent)
DateHeaderItem.displayName = 'DateHeaderItem'
