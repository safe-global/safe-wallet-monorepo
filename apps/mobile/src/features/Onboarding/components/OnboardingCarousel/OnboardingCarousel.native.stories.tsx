import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { OnboardingCarousel } from './OnboardingCarousel'
import { items } from './items'
import { SafeButton } from '@/src/components/SafeButton'
import { action } from '@storybook/addon-actions'

const meta: Meta<typeof OnboardingCarousel> = {
  title: 'Carousel',
  component: OnboardingCarousel,
}

export default meta

type Story = StoryObj<typeof OnboardingCarousel>

export const Default: Story = {
  render: function Render(args) {
    return (
      <OnboardingCarousel {...args} items={items}>
        <SafeButton onPress={action('onPress')}>Get started</SafeButton>
      </OnboardingCarousel>
    )
  },
}
