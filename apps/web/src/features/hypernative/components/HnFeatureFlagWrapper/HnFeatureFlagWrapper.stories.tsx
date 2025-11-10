import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentType } from 'react'
import { HnFeatureFlagWrapper } from './HnFeatureFlagWrapper'
import type { HnFeatureFlagWrapperProps } from './HnFeatureFlagWrapper'
import HnBanner from '../HnBanner'
import type { HnBannerProps } from '../HnBanner'
import PendingBanner from '../PendingBanner'
import type { PendingBannerProps } from '../PendingBanner'
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
    component: HnBanner as ComponentType<HnBannerProps>,
    componentProps: {
      href: '#',
      onDismiss: () => {},
      isDismissable: true,
    } as HnBannerProps,
  },
}

export const WithPendingBanner: Story = {
  args: {
    component: PendingBanner as ComponentType<PendingBannerProps>,
    componentProps: {
      onDismiss: () => {},
    } as PendingBannerProps,
  },
}

export const WithDashboardBanner: Story = {
  args: {
    component: DashboardBanner as ComponentType<Record<string, never>>,
    componentProps: {} as Record<string, never>,
  },
}
