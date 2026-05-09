import type { Meta, StoryObj } from '@storybook/react'
import { Alert } from '@/src/components/Alert'

const meta: Meta<typeof Alert> = {
  title: 'Alert',
  component: Alert,
  argTypes: {
    type: { control: 'select', options: ['error', 'warning', 'info'] },
    message: { type: 'string' },
    iconName: { type: 'string' },
    displayIcon: { type: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof Alert>

export const Warning: Story = {
  args: {
    type: 'warning',
    message: 'Proceed with caution',
    displayIcon: true,
  },
}

export const Error: Story = {
  args: {
    type: 'error',
    message: 'The transaction will most likely fail',
    displayIcon: true,
  },
}

export const Info: Story = {
  args: {
    type: 'info',
    message: 'This is info block',
    displayIcon: true,
  },
}

export const DarkModeTest: Story = {
  args: {
    type: 'warning',
    message: 'Test: This should look different in light vs dark mode screenshots',
    displayIcon: true,
  },
}
