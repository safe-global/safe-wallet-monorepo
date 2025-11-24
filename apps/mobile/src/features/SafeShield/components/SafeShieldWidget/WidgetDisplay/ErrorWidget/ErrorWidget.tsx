import React from 'react'
import { Text } from 'tamagui'
import { WidgetDisplayWrapper } from '../WidgetDisplayWrapper'

export function ErrorWidget() {
  return (
    <WidgetDisplayWrapper gap="$0">
      <Text color="$colorSecondary" fontSize="$2" textAlign="center">
        Transaction checks are temporarily unavailable.
      </Text>
      <Text color="$colorSecondary" fontSize="$2" textAlign="center">
        Please try again later.
      </Text>
    </WidgetDisplayWrapper>
  )
}
