import type { Meta, StoryObj } from '@storybook/react'
import SecurityDrawerDetails from './SecurityDrawerDetails'

const meta = {
  title: 'Features/SecurityHub/SecurityDrawerDetails',
  component: SecurityDrawerDetails,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof SecurityDrawerDetails>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
