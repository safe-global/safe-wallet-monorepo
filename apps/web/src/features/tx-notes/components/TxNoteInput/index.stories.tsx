import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/decorators'
import { STORY_NOTES, withPrivateNotes } from '../../public/services/privateNotesStoryData'
import TxNoteInput from './index'

// Prototype. The note field on the Review step: private, 280 characters, written once by the proposer.
const meta = {
  title: 'Features/TxNotes/TxNoteInput',
  component: TxNoteInput,
  parameters: { layout: 'padded' },
  args: { onChange: () => {} },
  decorators: [
    (Story) => (
      <div className="max-w-[640px]">
        <Story />
      </div>
    ),
    withMockProvider({ shadcn: true, withPaper: true }),
  ],
} satisfies Meta<typeof TxNoteInput>

export default meta
type Story = StoryObj<typeof meta>

/** Signed in to a Workspace on Pro */
export const Default: Story = {}

export const Filled: Story = { args: { defaultValue: STORY_NOTES.invoice().text } }

/** 280 of 280: typing stops and the counter changes colour */
export const AtLimit: Story = { args: { defaultValue: STORY_NOTES.long().text } }

/** Two signers of the Safe are not members of the Workspace, so they never see the note */
export const OutsideSigners: Story = {
  args: { defaultValue: STORY_NOTES.invoice().text },
  decorators: [withPrivateNotes({ outsideSigners: 2 })],
}

/** The Safe is in a Workspace on Pro, the wallet is connected, the user is not signed in */
export const SignedOut: Story = { decorators: [withPrivateNotes({ access: 'signedOut' })] }

/** The Workspace's plan has no private notes */
export const LockedPlan: Story = { decorators: [withPrivateNotes({ access: 'lockedPlan' })] }

/** The Safe is in no Workspace */
export const NoWorkspace: Story = { decorators: [withPrivateNotes({ access: 'noWorkspace' })] }
