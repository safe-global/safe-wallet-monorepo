import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { NAME_MIN_LENGTH } from '@safe-global/utils/validation/names'
import AddMemberModal from '.'
import { createMockStory } from '@/stories/mocks'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  authenticated: true,
  pathname: '/spaces/members',
  query: { spaceId: '1' },
  shadcn: true,
})

const meta = {
  title: 'Features/Spaces/AddMemberModal',
  component: AddMemberModal,
  loaders: [mswLoader],
  decorators: [defaultSetup.decorator],
  parameters: {
    layout: 'centered',
    ...defaultSetup.parameters,
  },
  args: {
    onClose: () => {},
  },
} satisfies Meta<typeof AddMemberModal>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NameValidationError: Story = {
  play: async () => {
    // The modal renders through a portal, so query the document rather than the canvas.
    const screen = within(document.body)
    // The dialog focuses its first control once it opens; typing earlier loses the focus to it
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement))

    await userEvent.type(await screen.findByTestId('member-name-input'), 'Jo')
    await screen.findByText(`Names must be at least ${NAME_MIN_LENGTH} character(s) long`)
  },
}
