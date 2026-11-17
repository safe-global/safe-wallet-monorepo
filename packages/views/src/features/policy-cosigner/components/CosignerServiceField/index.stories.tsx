import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/decorators'
import CosignerServiceField from './index'

const meta = {
  title: 'Features/PolicyCosigner/CosignerServiceField',
  component: CosignerServiceField,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    name: 'cosignerUrl',
    onChange: () => {},
    onReset: () => {},
    chainName: 'Sepolia',
  },
  decorators: [withMockProvider({ shadcn: true })],
} satisfies Meta<typeof CosignerServiceField>

export default meta
type Story = StoryObj<typeof meta>

export const NotConfigured: Story = {
  args: {
    value: '',
    showResetButton: false,
  },
}

export const WithDefault: Story = {
  args: {
    value: '',
    showResetButton: false,
    defaultUrl: 'https://cosigner.example.com',
  },
}

export const Overridden: Story = {
  args: {
    value: 'http://localhost:3000/cosigner',
    showResetButton: true,
    defaultUrl: 'https://cosigner.example.com',
  },
}
