import type { Meta, StoryObj } from '@storybook/react'
import { SafeShieldHeadline } from './SafeShieldHeadline'
import { action } from '@storybook/addon-actions'

const meta: Meta<typeof SafeShieldHeadline> = {
  title: 'SafeShield/SafeShieldHeadline',
  component: SafeShieldHeadline,
  argTypes: {
    type: {
      control: 'select',
      options: ['safeShield_OK', 'safeShield_CRITICAL', 'safeShield_INFO', 'safeShield_WARN'],
    },
    withIcon: { control: 'boolean' },
    onPress: { action: 'onPress' },
  },
}

export default meta

type Story = StoryObj<typeof SafeShieldHeadline>

export const ChecksPassed: Story = {
  args: {
    type: 'safeShield_OK',
    withIcon: true,
    onPress: action('onPress'),
  },
}

export const StaticChecksPassed: Story = {
  args: {
    type: 'safeShield_OK',
    withIcon: false,
  },
}

export const ChecksFailed: Story = {
  args: {
    type: 'safeShield_CRITICAL',
    withIcon: true,
    onPress: action('onPress'),
  },
}

export const StaticChecksFailed: Story = {
  args: {
    type: 'safeShield_CRITICAL',
    withIcon: false,
  },
}

export const ReviewDetails: Story = {
  args: {
    type: 'safeShield_INFO',
    withIcon: true,
    onPress: action('onPress'),
  },
}

export const StaticReviewDetails: Story = {
  args: {
    type: 'safeShield_INFO',
    withIcon: false,
  },
}

export const IssuesFound: Story = {
  args: {
    type: 'safeShield_WARN',
    withIcon: true,
    onPress: action('onPress'),
  },
}

export const StaticIssuesFound: Story = {
  args: {
    type: 'safeShield_WARN',
    withIcon: false,
  },
}
