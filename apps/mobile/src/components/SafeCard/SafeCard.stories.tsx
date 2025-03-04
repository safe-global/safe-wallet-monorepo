import type { Meta, StoryObj } from '@storybook/react'
import { SafeCard } from '@/src/components/SafeCard'
import { SafeFontIcon } from '../SafeFontIcon'
import Seed from '@/assets/images/seed.png'
import { Text } from 'tamagui'

const meta: Meta<typeof SafeCard> = {
  title: 'SafeCard',
  component: SafeCard,
  args: {
    title: 'Welcome to Safe',
    description: 'Add a new owner to your Safe',
  },
}

export default meta

type Story = StoryObj<typeof SafeCard>

export const Default: Story = {
  args: {
    title: 'Welcome to Safe',
    description: 'Add a new owner to your Safe',
  },
  render: (args) => <SafeCard {...args} icon={<SafeFontIcon name="safe" size={24} />} image={Seed} />,
}

export const OnlyText: Story = {
  args: {
    title: 'Welcome to Safe',
    description: 'Add a new owner to your Safe',
  },
}

export const withChildren: Story = {
  args: {
    title: 'Welcome to Safe',
    description: 'Add a new owner to your Safe',
  },
  render: (args) => (
    <SafeCard {...args}>
      <Text marginTop={'$4'}>Hello from children</Text>
    </SafeCard>
  ),
}
