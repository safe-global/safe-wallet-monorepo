import React from 'react'
import { GetThemeValueForKey, Text, View } from 'tamagui'
import { LargeHeaderTitle } from './LargeHeaderTitle'

interface SectionTitleProps {
  title: string
  description: string
  paddingHorizontal?: GetThemeValueForKey<'paddingHorizontal'>
}

export function SectionTitle({ title, description, paddingHorizontal = '$3' }: SectionTitleProps) {
  return (
    <View gap="$6" paddingHorizontal={paddingHorizontal}>
      <View flexDirection={'row'} alignItems={'center'} paddingTop={'$3'}>
        <LargeHeaderTitle marginRight={5}>{title}</LargeHeaderTitle>
      </View>

      <Text>{description}</Text>
    </View>
  )
}
