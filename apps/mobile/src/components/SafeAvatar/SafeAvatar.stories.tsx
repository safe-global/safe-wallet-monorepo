import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { SafeAvatar } from '@/src/components/SafeAvatar/SafeAvatar'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'

const meta: Meta<typeof SafeAvatar> = {
  title: 'SafeAvatar',
  component: SafeAvatar,
  argTypes: {
    src: { control: 'text' },
    size: { control: 'text' },
    label: { control: 'text' },
    delayMs: { control: 'number' },
    fallbackBackgroundColor: { control: 'color' },
    // fallbackIcon is a ReactNode, so we disable controls
    fallbackIcon: { control: false },
  },
}

export default meta

type Story = StoryObj<typeof SafeAvatar>

export const Loaded: Story = {
  args: {
    src: 'https://safe-wallet-web.dev.5afe.dev/favicons/favicon.ico',
    size: '$10',
    label: 'Safe Avatar',
  },
}

export const Fallback: Story = {
  args: {
    src: '',
    size: '$10',
    label: 'Fallback Avatar',
    fallbackBackgroundColor: '$gray4',
    fallbackIcon: <SafeFontIcon name="code-blocks" size={16} color="$color" />,
  },
}
