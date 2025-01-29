import type { Meta, StoryObj } from '@storybook/react'
import { SafeCard } from './SafeCard'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Image } from 'tamagui'

const meta: Meta<typeof SafeCard> = {
  title: 'SafeCard',
  component: SafeCard,
  args: {
    title: 'Welcome to Safe',
    description: 'The most trusted decentralized custody protocol and collective asset management platform',
  },
}

export default meta

type Story = StoryObj<typeof SafeCard>

export const Default: Story = {}

export const WithIcon: Story = {
  args: {
    icon: <SafeFontIcon name="safe" size={24} />,
  },
}

export const WithImage: Story = {
  args: {
    image: require('@/assets/welcome.png'),
  },
}

export const WithChildren: Story = {
  args: {
    children: <Image source={require('@/assets/logo.png')} width={100} height={100} marginTop="$4" />,
  },
}

export const Complete: Story = {
  args: {
    icon: <SafeFontIcon name="safe" size={24} />,
    image: require('@/assets/welcome.png'),
    children: <Image source={require('@/assets/logo.png')} width={100} height={100} marginTop="$4" />,
  },
}
