import type { Meta, StoryObj } from '@storybook/react'
import NestedSafeGrantNotice from './NestedSafeGrantNotice'

const meta = {
  title: 'Features/Spaces/Policies/ProposerDrawer/components/NestedSafeGrantNotice',
  component: NestedSafeGrantNotice,
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
} satisfies Meta<typeof NestedSafeGrantNotice>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The Safe's chain is not in the config, so there is no settings page to link to. */
export const WithoutSettingsLink: Story = {
  args: {
    settingsHref: undefined,
  },
}

/** No address book entries — the shortened addresses stand in for the names. */
export const UnnamedSafes: Story = {
  args: {
    safeName: '0x8675...a19b',
    parentSafeName: '0x2222...2222',
  },
}
