import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { HnFeatureFlagWrapper, type HnFeatureFlagWrapperProps } from './HnFeatureFlagWrapper'
import HnBanner, { type HnBannerProps } from '../HnBanner'
import PendingBanner, { type PendingBannerProps } from '../PendingBanner'
import DashboardBanner from '../DashboardBanner'

const meta: Meta<HnFeatureFlagWrapperProps> = {
  component: HnFeatureFlagWrapper,
  title: 'Features/Hypernative/HnFeatureFlagWrapper',
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<HnFeatureFlagWrapperProps>

export const WithHnBanner: Story = {
  args: {
    component: HnBanner as React.ComponentType<HnBannerProps>,
    componentProps: {
      href: '#',
      onDismiss: () => {},
      isDismissable: true,
    } as HnBannerProps,
  },
}

export const WithPendingBanner: Story = {
  args: {
    component: PendingBanner as React.ComponentType<PendingBannerProps>,
    componentProps: {
      onDismiss: () => {},
    } as PendingBannerProps,
  },
}

export const WithDashboardBanner: Story = {
  args: {
    component: DashboardBanner as React.ComponentType<Record<string, never>>,
    componentProps: {} as Record<string, never>,
  },
}
