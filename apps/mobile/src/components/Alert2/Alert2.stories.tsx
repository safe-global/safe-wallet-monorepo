import type { Meta, StoryObj } from '@storybook/react'
import { Alert2 } from './Alert2'

const meta: Meta<typeof Alert2> = {
  title: 'Components/Alert2',
  component: Alert2,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['error', 'warning', 'info', 'success'],
    },
    title: {
      control: { type: 'text' },
    },
    message: {
      control: { type: 'text' },
    },
    iconName: {
      control: { type: 'text' },
    },
    testID: {
      control: { type: 'text' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Warning: Story = {
  args: {
    type: 'warning',
    title: 'Base contract is not supported',
    message:
      "Your Safe Account's base contract is not supported. You should migrate it to a compatible version. Use the web app for this.",
    testID: 'warning-alert',
  },
}

export const Error: Story = {
  args: {
    type: 'error',
    title: 'Transaction failed',
    message: 'The transaction could not be processed due to insufficient funds.',
    testID: 'error-alert',
  },
}

export const Info: Story = {
  args: {
    type: 'info',
    title: 'New feature available',
    message: 'Check out the new transaction batching feature in the latest update.',
    testID: 'info-alert',
  },
}

export const Success: Story = {
  args: {
    type: 'success',
    title: 'Transaction confirmed',
    message: 'Your transaction has been successfully confirmed on the blockchain.',
    testID: 'success-alert',
  },
}

export const CustomIcon: Story = {
  args: {
    type: 'warning',
    title: 'Custom icon example',
    message: 'This alert uses a custom icon instead of the default type icon.',
    iconName: 'settings',
    testID: 'custom-icon-alert',
  },
}

export const LongMessage: Story = {
  args: {
    type: 'info',
    title: 'Long message example',
    message:
      'This is a very long message to demonstrate how the Alert2 component handles multi-line text content. The message should wrap properly and maintain good readability with proper spacing between the icon and text content.',
    testID: 'long-message-alert',
  },
}
