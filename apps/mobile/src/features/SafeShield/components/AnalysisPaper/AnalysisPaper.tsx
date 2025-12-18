import React from 'react'
import { Stack } from 'tamagui'

interface AnalysisPaperProps {
  children: React.ReactNode
  spaced?: boolean
}

export function AnalysisPaper({ children, spaced }: AnalysisPaperProps) {
  return (
    <Stack padding="$2" paddingRight={spaced ? '$3' : '$2'} gap="$1" backgroundColor="$background" borderRadius="$1">
      {children}
    </Stack>
  )
}
