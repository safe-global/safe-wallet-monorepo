import type { Meta, StoryObj } from '@storybook/react'
import EditTagsDialog from './EditTagsDialog'
import { ADDRESSES, WORKSPACE_TAGS } from './mocks/fixtures'

const meta = {
  title: 'Features/Spaces/AddressBookV2/EditTagsDialog',
  component: EditTagsDialog,
  args: {
    contact: { name: 'Northwind Logistics', address: ADDRESSES.northwind, tagIds: [2] },
    workspaceTags: WORKSPACE_TAGS,
    onSave: () => {},
    onClose: () => {},
  },
  tags: ['skip-visual-test'],
} satisfies Meta<typeof EditTagsDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Saving: Story = { args: { isSubmitting: true } }

export const WithError: Story = {
  args: { error: 'Your workspace has 8 tags. Rename or delete one to add another.' },
}
