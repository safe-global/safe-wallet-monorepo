import React from 'react'
import { Stack } from 'tamagui'

interface AnalysisPaperProps {
  children: React.ReactNode
  spaced?: boolean
  fitBottom?: boolean
}

export function AnalysisPaper({ children, spaced, fitBottom }: AnalysisPaperProps) {
  return (
    <Stack
      padding="$2"
      borderRadius="$4"
      borderBottomLeftRadius={fitBottom ? '$4' : '0'}
      borderBottomRightRadius={fitBottom ? '$4' : '0'}
      paddingRight={spaced ? '$3' : '$2'}
      gap="$1"
      backgroundColor="$background"
    >
      {children}
    </Stack>
  )
}
