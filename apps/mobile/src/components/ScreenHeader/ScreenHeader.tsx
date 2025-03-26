import React from 'react'
import { View } from 'tamagui'
import { SectionTitle } from '@/src/components/Title'

interface ScreenHeaderProps {
  sectionTitle: string
  paddingHorizontal?: string
}

export function ScreenHeader({ sectionTitle, paddingHorizontal = '$0' }: ScreenHeaderProps) {
  return (
    <View gap="$6" paddingHorizontal={paddingHorizontal}>
      <SectionTitle paddingHorizontal={'$0'} title={sectionTitle} />
    </View>
  )
}
