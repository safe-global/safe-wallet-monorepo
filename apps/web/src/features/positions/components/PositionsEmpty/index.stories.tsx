import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'
import PositionsEmpty from './index'

const SAFE_QUERY = 'eth:0x0000000000000000000000000000000000000001'

const meta = {
  title: 'Features/Positions/PositionsEmpty',
  component: PositionsEmpty,
  parameters: {
    componentSubtitle: 'Empty state for the positions list, with the DeFi icon centered above the message',
  },
  decorators: [
    // The component reads chain features through useAppSelector, so it needs a store Provider.
    (Story) => (
      <StoreDecorator initialState={{}}>
        <RouterDecorator router={{ query: { safe: SAFE_QUERY } }}>
          <div className="max-w-md">
            <Story />
          </div>
        </RouterDecorator>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof PositionsEmpty>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}
