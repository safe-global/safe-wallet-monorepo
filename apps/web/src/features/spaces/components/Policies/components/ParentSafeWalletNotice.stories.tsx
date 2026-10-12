import type { Meta, StoryObj } from '@storybook/react'
import ParentSafeWalletNotice from './ParentSafeWalletNotice'

const meta = {
  title: 'Features/Spaces/Policies/components/ParentSafeWalletNotice',
  component: ParentSafeWalletNotice,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    title: 'Add this proposer on the Safe account level',
    action: 'grant this role',
    safeName: 'Marketing',
    parentSafeName: 'Ops',
    settingsHref: { pathname: '/settings/setup', query: { safe: 'eth:0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0' } },
  },
  decorators: [
    (Story) => (
      <div className="w-[408px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ParentSafeWalletNotice>

export default meta
type Story = StoryObj<typeof meta>

export const Proposer: Story = {}

export const SpendingLimit: Story = {
  args: {
    title: 'Add this spending limit on the Safe account level',
    action: 'set this spending limit',
  },
}

export const WithoutSettingsLink: Story = {
  args: {
    settingsHref: undefined,
  },
}

export const UnnamedSafes: Story = {
  args: {
    safeName: '0x8675...a19b',
    parentSafeName: '0x2222...2222',
  },
}
