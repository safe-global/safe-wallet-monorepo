import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { userEvent, within } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import { INVALID_IDENTIFIER_ERROR } from '../AddMemberModal/utils'
import InviteMembersOnboarding from '.'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  pathname: '/welcome/invite-members',
  query: { spaceId: 'uuid-1' },
  shadcn: true,
})

const meta = {
  title: 'Features/Spaces/InviteMembersOnboarding',
  component: InviteMembersOnboarding,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof InviteMembersOnboarding>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ValidationError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByTestId('add-another-member'))
    await userEvent.type(canvas.getByTestId('invite-identifier-input-0'), 'not-an-email')

    // The error is debounced by ERROR_DEBOUNCE_MS before it renders.
    await canvas.findByText(INVALID_IDENTIFIER_ERROR, {}, { timeout: 3000 })
  },
}
