import React from 'react'
import { OnboardingCarousel } from './components/OnboardingCarousel'
import { items } from './components/OnboardingCarousel/items'

export function Onboarding() {
  return <OnboardingCarousel items={items} />
}
