import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import TxNoteInput from './index'

// TxNoteInput is the optional note field shown while creating a transaction:
// a 60-character-limited input with a live counter and a public-visibility
// warning underneath.
const meta = {
  title: 'Features/TxNotes/TxNoteInput',
  component: TxNoteInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [withMockProvider({ shadcn: true, withPaper: true })],
} satisfies Meta<typeof TxNoteInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onChange: () => {},
  },
}
