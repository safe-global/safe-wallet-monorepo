import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@/components/ui/typography'
import CopyAddressButton from './index'
import { StoreDecorator } from '@/stories/storeDecorator'

const meta = {
  title: 'Components/Common/CopyAddressButton',
  component: CopyAddressButton,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{}}>
        <div className="rounded-lg bg-[var(--color-background-paper)] p-4">
          <Story />
        </div>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof CopyAddressButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
  },
}

export const WithPrefix: Story = {
  args: {
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    prefix: 'eth',
    copyPrefix: true,
  },
}

export const WithChildren: Story = {
  args: {
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    children: <Typography variant="paragraph-small">0xd9Db...9552</Typography>,
  },
}

export const Untrusted: Story = {
  args: {
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    trusted: false,
    children: <Typography>Click to copy (untrusted)</Typography>,
  },
}
