import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/decorators'
import { AppRoutes } from '@/config/routes'
import { STORY_NOTES } from '../../public/services/privateNotesStoryData'
import PrivateNote from './index'

// Prototype. The block a signer reads a note in, in the Safe: transaction details and the confirm screen.
const meta = {
  title: 'Features/TxNotes/PrivateNote',
  component: PrivateNote,
  parameters: { layout: 'padded' },
  decorators: [withMockProvider({ shadcn: true, withPaper: true })],
} satisfies Meta<typeof PrivateNote>

export default meta
type Story = StoryObj<typeof meta>

export const Private: Story = { args: { variant: 'private', ...STORY_NOTES.invoice() } }

/** The limit, 280 characters, in full */
export const PrivateLong: Story = { args: { variant: 'private', ...STORY_NOTES.long() } }

/** A note that pushes the signer. The link is plain text and the label says who wrote it. */
export const Pressure: Story = { args: { variant: 'private', ...STORY_NOTES.pressure() } }

/** After a downgrade or the end of a trial: the note is kept, members cannot read it */
export const Hidden: Story = { args: { variant: 'hidden', upgradeHref: AppRoutes.spaces.plans } }

/** A note written before private notes: still readable, labelled public */
export const Public: Story = {
  args: { variant: 'public', text: 'Monthly contributor payroll, batch 2 of 3', author: 'transaction creator' },
}

export const AllVariants: Story = {
  args: { variant: 'private' },
  render: () => (
    <div className="flex max-w-2xl flex-col gap-4">
      <PrivateNote variant="private" {...STORY_NOTES.invoice()} />
      <PrivateNote variant="private" {...STORY_NOTES.long()} />
      <PrivateNote variant="private" {...STORY_NOTES.pressure()} />
      <PrivateNote variant="hidden" upgradeHref={AppRoutes.spaces.plans} />
      <PrivateNote variant="public" text="Monthly contributor payroll, batch 2 of 3" author="transaction creator" />
    </div>
  ),
}
