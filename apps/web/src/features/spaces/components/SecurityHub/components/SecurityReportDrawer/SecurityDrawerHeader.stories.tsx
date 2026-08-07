import type { Meta, StoryObj } from '@storybook/react'
import SecurityDrawerHeader from './SecurityDrawerHeader'

const SAFE_A = '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'

const meta = {
  title: 'Features/SecurityHub/SecurityDrawerHeader',
  component: SecurityDrawerHeader,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof SecurityDrawerHeader>

export default meta
type Story = StoryObj<typeof meta>

export const WithName: Story = {
  args: {
    address: SAFE_A,
    name: 'Rewards vault',
    onClose: () => {},
  },
}

export const WithoutName: Story = {
  args: {
    address: SAFE_A,
    onClose: () => {},
  },
}
