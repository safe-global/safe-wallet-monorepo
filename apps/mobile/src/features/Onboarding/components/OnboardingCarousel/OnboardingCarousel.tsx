import React, { useState } from 'react'
import { CarouselItem } from './CarouselItem'
import { View } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { Tabs } from 'react-native-collapsible-tab-view'
import { CarouselFeedback } from './CarouselFeedback'

import { useRouter } from 'expo-router'

interface OnboardingCarouselProps {
  items: CarouselItem[]
}

export function OnboardingCarousel({ items }: OnboardingCarouselProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const router = useRouter()

  const onGetStartedPress = () => {
    router.navigate('/(tabs)')
  }

  return (
    <View testID="carrousel" flex={1} justifyContent={'space-between'} position="relative" paddingVertical="$10">
      <Tabs.Container
        onTabChange={(event) => setActiveTab(event.tabName)}
        initialTabName={items[0].name}
        renderTabBar={() => <></>}
      >
        {items.map((item, index) => (
          <Tabs.Tab name={item.name} key={`${item.name}-${index}`}>
            <CarouselItem key={index} item={item} />
          </Tabs.Tab>
        ))}
      </Tabs.Container>

      <View paddingHorizontal={20}>
        <View gap="$1" flexDirection="row" alignItems="center" justifyContent="center" marginBottom="$6">
          {items.map((item) => (
            <CarouselFeedback key={item.name} isActive={activeTab === item.name} />
          ))}
        </View>
        <View style={{ flexDirection: 'column', justifyContent: 'space-between' }}>
          <SafeButton onPress={onGetStartedPress}>Get started</SafeButton>
        </View>
      </View>
    </View>
  )
}
