import type { Meta, StoryObj } from '@storybook/react'
import { HypernativeLoginLine } from './HypernativeLoginLine'

const meta: Meta<typeof HypernativeLoginLine> = {
  title: 'Features/SafeShield/HypernativeLoginLine',
  component: HypernativeLoginLine,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const LoggedOut: Story = {
  args: {
    hypernativeAuth: { isAuthenticated: false, isTokenExpired: false, initiateLogin: () => {}, logout: () => {} },
  },
  parameters: { docs: { description: { story: 'Eligible Safe whose user has not logged in to Hypernative' } } },
}

export const TokenExpired: Story = {
  args: {
    hypernativeAuth: { isAuthenticated: true, isTokenExpired: true, initiateLogin: () => {}, logout: () => {} },
  },
  parameters: { docs: { description: { story: 'Eligible Safe whose Hypernative session has expired' } } },
}
