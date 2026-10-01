import type { Meta, StoryObj } from '@storybook/react'
import ParentSafeWalletNotice from './ParentSafeWalletNotice'

const meta = {
  title: 'Features/Spaces/Policies/ProposerRoleFlow/components/ParentSafeWalletNotice',
  component: ParentSafeWalletNotice,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
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

export const Default: Story = {}

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
