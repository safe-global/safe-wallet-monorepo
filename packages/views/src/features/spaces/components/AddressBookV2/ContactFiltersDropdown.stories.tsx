import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import ContactFiltersDropdown from './ContactFiltersDropdown'
import { WORKSPACE_TAGS } from './mocks/fixtures'

const meta = {
  title: 'Features/Spaces/AddressBookV2/ContactFiltersDropdown',
  component: ContactFiltersDropdown,
  parameters: { layout: 'padded' },
  args: { tags: WORKSPACE_TAGS, selectedTagIds: [], onSelectedTagIdsChange: () => {} },
  render: (args) => {
    const [selectedTagIds, setSelectedTagIds] = useState(args.selectedTagIds)
    const [tags, setTags] = useState(args.tags)
    return (
      <ContactFiltersDropdown
        {...args}
        tags={tags}
        selectedTagIds={selectedTagIds}
        onSelectedTagIdsChange={setSelectedTagIds}
        tagEditing={
          args.tagEditing && {
            onRename: async (tag, name) => {
              setTags((current) => current.map((item) => (item.id === tag.id ? { ...item, name } : item)))
              return undefined
            },
            onDelete: async (tag) => {
              setTags((current) => current.filter((item) => item.id !== tag.id))
              setSelectedTagIds((ids) => ids.filter((id) => id !== tag.id))
            },
          }
        }
      />
    )
  },
} satisfies Meta<typeof ContactFiltersDropdown>

export default meta
type Story = StoryObj<typeof meta>

/** Invited people can filter but not rename or delete. */
export const ReadOnly: Story = {}

/** Any active member: hover a tag for rename and delete. */
export const Editable: Story = {
  args: { tagEditing: { onRename: async () => undefined, onDelete: async () => {} } },
}

export const WithSelection: Story = {
  args: { selectedTagIds: [1, 2], tagEditing: { onRename: async () => undefined, onDelete: async () => {} } },
}
