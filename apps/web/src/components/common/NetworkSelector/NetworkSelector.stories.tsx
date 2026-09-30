import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import NetworkSelector from './index'

// No Safe loaded, which is how the live consumer (the "Add existing Safe" step) renders it — and the
// case where the dropdown lists every configured network rather than one Safe's own chains.
// Blanking the address is what achieves that: `createInitialState` always seeds `safeInfo.data` and
// falls back to the fixture when an override sets it to undefined, but it does shallow-merge the
// object, so an empty `address.value` reaches `useSafeInfo` and reads as "no Safe open".
const noSafeLoaded = createMockStory({
  scenario: 'efSafe',
  pathname: '/new-safe/load',
  shadcn: true,
  store: { safeInfo: { data: { address: { value: '' } } } },
})

const meta = {
  title: 'Components/Common/NetworkSelector',
  component: NetworkSelector,
  loaders: [mswLoader],
  decorators: [noSafeLoaded.decorator],
  parameters: {
    layout: 'centered',
    ...noSafeLoaded.parameters,
  },
} satisfies Meta<typeof NetworkSelector>

export default meta

type Story = StoryObj<typeof meta>

/** The closed trigger. Opening it reveals the search field above the network list. */
export const Default: Story = {}
