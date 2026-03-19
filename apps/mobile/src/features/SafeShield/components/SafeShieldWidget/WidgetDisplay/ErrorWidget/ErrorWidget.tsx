import React from 'react'
import { Text, Button, Stack } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { WidgetDisplayWrapper } from '../WidgetDisplayWrapper'

interface ErrorWidgetProps {
  message?: string
  onRefresh?: () => void
}

export function ErrorWidget({ message = 'Unable to load content', onRefresh }: ErrorWidgetProps) {
  return (
    <WidgetDisplayWrapper gap="$5" alignItems="center" paddingVertical="$4">
      <Stack
        backgroundColor="$backgroundPress"
        borderRadius="$2"
        width={40}
        height={40}
        alignItems="center"
        justifyContent="center"
      >
        <SafeFontIcon name="alert-circle-filled" size={24} color="$colorSecondary" />
      </Stack>

      <Stack gap="$1" alignItems="center">
        <Text color="$colorSecondary" fontSize="$4" fontWeight="600" textAlign="center">
          {message}
        </Text>
        <Text color="$colorSecondary" fontSize="$3" textAlign="center">
          Try to reload the page.
        </Text>
      </Stack>

      {onRefresh && (
        <Button size="$3" onPress={onRefresh}>
          <Button.Text>Reload page</Button.Text>
        </Button>
      )}
    </WidgetDisplayWrapper>
  )
}
