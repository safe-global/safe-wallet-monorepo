import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks/createMockStory'
import { spaceWithSafesHandler } from '@/stories/mocks/handlers'
import SpaceAssetsPage from './Page'

const SPACE_ID = '1'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  authenticated: true,
  pathname: '/spaces/assets',
  query: { spaceId: SPACE_ID },
  layout: 'paper',
  shadcn: true,
})

const meta = {
  title: 'Features/Spaces/Assets/SpaceAssetsPage',
  component: SpaceAssetsPage,
  args: { spaceId: SPACE_ID },
  parameters: { ...setup.parameters, msw: { handlers: [spaceWithSafesHandler, ...setup.handlers] } },
  decorators: [setup.decorator],
} satisfies Meta<typeof SpaceAssetsPage>

export default meta
type Story = StoryObj<typeof meta>

/** Two Space Safes on Ethereum, each answered with the scenario's portfolio */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const { within } = await import('storybook/test')
    await within(canvasElement).findAllByTestId('space-assets-protocol', {}, { timeout: 10_000 })
  },
}

/** A Space without Safe accounts */
export const Empty: Story = {
  parameters: { msw: { handlers: setup.handlers } },
}
