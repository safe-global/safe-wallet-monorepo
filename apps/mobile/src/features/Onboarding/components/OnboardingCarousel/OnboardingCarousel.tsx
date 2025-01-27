import React, { useCallback, useEffect, useState } from 'react'
import { Dimensions, StyleSheet, useColorScheme } from 'react-native'
import { CarouselItem } from './CarouselItem'
import { View, Image } from 'tamagui'
import { useRouter } from 'expo-router'
import { SafeButton } from '@/src/components/SafeButton'
import { Tabs } from 'react-native-collapsible-tab-view'
import { CarouselFeedback } from './CarouselFeedback'

import useNotifications from '@/src/hooks/useNotifications'
interface OnboardingCarouselProps {
  items: CarouselItem[]
}

const windowHeight = Dimensions.get('window').height

export function OnboardingCarousel({ items }: OnboardingCarouselProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const { enableNotifications, isAppNotificationEnabled } = useNotifications(true)

  const router = useRouter()
  const theme = useColorScheme()

  const notificationsImg =
    theme === 'dark'
      ? require('@/assets/images/notifications-dark.png')
      : require('@/assets/images/notifications-light.png')

  const onGetStartedPress = () => {
    router.navigate('/(tabs)')
  }

  useEffect(() => {
    if (isAppNotificationEnabled) {
      onGetStartedPress()
    }

    items.forEach((item) => {
      if (item.name === 'enable-notifications') {
        item.image = <Image style={[styles.image]} source={notificationsImg} />
      }
    })
  }, [isAppNotificationEnabled])

  const renderSafeButtonGr = useCallback((index: number) => {
    if (index === items.length - 1) {
      return (
        <View style={{ flexDirection: 'column', justifyContent: 'space-between' }}>
          <SafeButton onPress={enableNotifications} label="Enable notifications" />
          <SafeButton variant="secondary" onPress={onGetStartedPress} label="Maybe later" />
        </View>
      )
    }
    return (
      <View style={{ flexDirection: 'column', justifyContent: 'space-between' }}>
        <SafeButton onPress={onGetStartedPress} label="Get started" />
        <View height={48} />
      </View>
    )
  }, [])

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
        {renderSafeButtonGr(items.findIndex((item) => item.name === activeTab))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: Math.abs(windowHeight * 0.32),
  },
})
