import type { Meta, StoryObj } from '@storybook/react'
import DialogActions from './index'

/**
 * DialogActions — the canonical dialog footer buttons.
 * Owns order, variants, sizes and responsive layout: Cancel = outline,
 * Confirm = default/destructive, both `size="submit"`.
 */
const meta = {
  title: 'Components/Common/DialogActions',
  component: DialogActions,
  args: { confirmLabel: 'Confirm' },
} satisfies Meta<typeof DialogActions>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div className="flex max-w-lg flex-col gap-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Cancel + Confirm</h3>
        <DialogActions confirmLabel="Save" onConfirm={() => {}} onCancel={() => {}} />
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold">Destructive</h3>
        <DialogActions confirmLabel="Delete workspace" onConfirm={() => {}} onCancel={() => {}} confirmDestructive />
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold">Loading</h3>
        <DialogActions confirmLabel="Create workspace" onConfirm={() => {}} onCancel={() => {}} confirmLoading />
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold">Confirm-only</h3>
        <DialogActions confirmLabel="Got it" onConfirm={() => {}} />
      </div>
      <p className="text-sm text-muted-foreground">
        On mobile the buttons stack with the confirm on top; on desktop they sit in a right-aligned row.
      </p>
    </div>
  ),
}
