import React from 'react'
import { OnboardingCarousel } from './components/OnboardingCarousel'
import { items } from './components/OnboardingCarousel/items'
import { useRouter } from 'expo-router'
import { SafeButton } from '@/src/components/SafeButton'

export function Onboarding() {
  const router = useRouter()

  const onGetStartedPress = () => {
    router.replace('/(tabs)')
  }

  return (
    <OnboardingCarousel items={items}>
      <SafeButton onPress={onGetStartedPress}>Get started</SafeButton>
    </OnboardingCarousel>
  )
}
