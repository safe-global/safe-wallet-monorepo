import React from 'react'
import { H4, View } from 'tamagui'

import { Loader } from '@/src/components/Loader'

interface LoadingScreenProps {
  title: string
  description: string
}

export function LoadingScreen({ title, description }: LoadingScreenProps) {
  return (
    <View flex={1} justifyContent="center" alignItems="center">
      <Loader size={64} color="#12FF80" />
      <H4 fontWeight={600} marginTop="$7" marginBottom="$4">
        {title}
      </H4>
      <H4 fontWeight={600} color="$textSecondaryLight">
        {description}
      </H4>
    </View>
  )
}
