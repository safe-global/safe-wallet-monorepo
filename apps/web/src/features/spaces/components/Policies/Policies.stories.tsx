import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import { mockPolicies } from './mocks/policies'
import Policies from './index'

const meta = {
  title: 'Features/Spaces/Policies',
  component: Policies,
  decorators: [withMockProvider()],
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Policies>

export default meta
type Story = StoryObj<typeof meta>

/** No policies yet: the page is the catalogue of what can be set up. */
export const Empty: Story = {}

/** With policies the page becomes the list of what is set up. */
export const Populated: Story = {
  args: { policies: mockPolicies() },
}

export const Loading: Story = {
  args: { policies: [], isLoading: true },
}

export const Error: Story = {
  args: { policies: [], isError: true, onRetry: () => {} },
}
