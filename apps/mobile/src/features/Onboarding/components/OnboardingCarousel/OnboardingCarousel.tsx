import React, { useState } from 'react'
import { CarouselItem } from './CarouselItem'
import { getTokenValue, View } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { Tabs } from 'react-native-collapsible-tab-view'
import { CarouselFeedback } from './CarouselFeedback'

import { useRouter } from 'expo-router'
import { useAppDispatch } from '@/src/store/hooks'
import { updateSettings } from '@/src/store/settingsSlice'
import { ONBOARDING_VERSION } from '@/src/config/constants'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface OnboardingCarouselProps {
  items: CarouselItem[]
}

export function OnboardingCarousel({ items }: OnboardingCarouselProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const dispatch = useAppDispatch()
  const router = useRouter()

  const insets = useSafeAreaInsets()

  const onGetStartedPress = () => {
    dispatch(updateSettings({ onboardingVersionSeen: ONBOARDING_VERSION }))
    router.navigate('/get-started')
  }

  return (
    <View backgroundColor={getTokenValue('$color.textContrastDark')} flex={1}>
      <View
        testID="carrousel"
        flex={1}
        justifyContent={'space-between'}
        position="relative"
        marginBottom={insets.bottom}
        backgroundColor={'white'}
        borderBottomLeftRadius="$6"
        borderBottomRightRadius="$6"
        paddingBottom={'$4'}
        paddingTop={'$4'}
      >
        <StatusBar style="light" />
        <View flex={1}>
          <Tabs.Container
            onTabChange={(event) => setActiveTab(event.tabName)}
            initialTabName={items[0].name}
            renderTabBar={() => <></>}
          >
            {items.map((item, index) => (
              <Tabs.Tab name={item.name} key={`${item.name}-${index}`}>
                <CarouselItem key={index} item={item} testID={'carousel-item-' + index} />
              </Tabs.Tab>
            ))}
          </Tabs.Container>
        </View>
        <View paddingHorizontal={'$5'}>
          <View gap="$1" flexDirection="row" alignItems="center" justifyContent="center" marginBottom="$6">
            {items.map((item) => (
              <CarouselFeedback key={item.name} isActive={activeTab === item.name} />
            ))}
          </View>
          <View style={{ flexDirection: 'column', justifyContent: 'space-between' }}>
            <SafeButton
              onPress={onGetStartedPress}
              testID={'get-started'}
              backgroundColor={getTokenValue('$color.textContrastDark')}
              color={getTokenValue('$color.textPrimaryDark')}
            >
              Get started
            </SafeButton>
          </View>
        </View>
      </View>
    </View>
  )
}
