import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { WORKSPACE_TAGS } from '../mocks/fixtures'
import type { WorkspaceTag } from '../types'
import TagSelect, { type TagActions, type TagSelectProps } from './TagSelect'

const COLORS: WorkspaceTag['color'][] = ['slate', 'clay', 'rose', 'lilac', 'iris', 'cobalt', 'sky', 'lagoon']

/** Keeps the tags in memory, as CGW would: a new tag gets a free colour and no contacts. */
const Interactive = ({
  mode,
  initialTags,
  initialValue,
}: Pick<TagSelectProps, 'mode'> & {
  initialTags: WorkspaceTag[]
  initialValue: number[]
}) => {
  const [tags, setTags] = useState(initialTags)
  const [value, setValue] = useState(initialValue)

  const actions: TagActions = {
    onCreate: async (name) => {
      const color = COLORS.find((candidate) => !tags.some((tag) => tag.color === candidate))
      if (!color) return { error: 'Your workspace has 8 tags. Rename or delete one to add another.' }
      const tag = { id: Math.max(0, ...tags.map((t) => t.id)) + 1, name, color, contactCount: 0 }
      setTags((current) => [...current, tag])
      return { tag }
    },
    onRename: async (tag, name) => {
      setTags((current) => current.map((item) => (item.id === tag.id ? { ...item, name } : item)))
      return {}
    },
    onDelete: async (tag) => setTags((current) => current.filter((item) => item.id !== tag.id)),
  }

  return <TagSelect mode={mode} tags={tags} value={value} onChange={setValue} actions={actions} />
}

const meta = {
  title: 'Features/Spaces/AddressBookV2/TagSelect',
  component: TagSelect,
  parameters: { layout: 'padded' },
  args: { mode: 'filter', tags: WORKSPACE_TAGS, value: [], onChange: () => {} },
} satisfies Meta<typeof TagSelect>

export default meta
type Story = StoryObj<typeof meta>

/** The Filters dropdown: ticking narrows the contacts; a new tag is not ticked. */
export const Filter: Story = {
  render: () => <Interactive mode="filter" initialTags={WORKSPACE_TAGS} initialValue={[]} />,
}

/** A contact's tags in Edit tags and Add / Edit contact: up to 3, with chips beside the button. */
export const Assign: Story = {
  render: () => <Interactive mode="assign" initialTags={WORKSPACE_TAGS} initialValue={[1]} />,
}

/** Invited people: no create, rename or delete. */
export const ReadOnly: Story = { args: { mode: 'filter', value: [2] } }
