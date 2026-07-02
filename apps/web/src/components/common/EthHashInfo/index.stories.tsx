import type { Meta, StoryObj } from '@storybook/react'
import EthHashInfo from './index'

import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'

const meta = {
  component: EthHashInfo,
  parameters: {
    componentSubtitle: 'Components/Common/EthHashInfo',
  },

  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <RouterDecorator>
            <div className="rounded-lg bg-[var(--color-background-paper)] p-4">
              <Story />
            </div>
          </RouterDecorator>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof EthHashInfo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
  },
}
