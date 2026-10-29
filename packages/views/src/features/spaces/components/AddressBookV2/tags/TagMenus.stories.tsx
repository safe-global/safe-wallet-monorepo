import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { WORKSPACE_TAGS } from '../mocks/fixtures'
import type { WorkspaceTag } from '../types'
import TagFilterDropdown from './TagFilterDropdown'
import type { TagActions } from './TagMenu'
import TagPicker from './TagPicker'

const COLORS: WorkspaceTag['color'][] = ['slate', 'clay', 'rose', 'lilac', 'iris', 'cobalt', 'sky', 'lagoon']

/** Keeps the tags in memory, as CGW would: a new tag gets a free colour and no contacts. */
const useInMemoryTags = (initialTags: WorkspaceTag[]) => {
  const [tags, setTags] = useState(initialTags)
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
  return { tags, actions }
}

const Filters = () => {
  const { tags, actions } = useInMemoryTags(WORKSPACE_TAGS)
  const [value, setValue] = useState<number[]>([])
  return <TagFilterDropdown tags={tags} value={value} onChange={setValue} actions={actions} />
}

const Picker = () => {
  const { tags, actions } = useInMemoryTags(WORKSPACE_TAGS)
  const [value, setValue] = useState<number[]>([1])
  return <TagPicker tags={tags} value={value} onChange={setValue} actions={actions} />
}

const meta = {
  title: 'Features/Spaces/AddressBookV2/TagMenus',
  component: TagPicker,
  parameters: { layout: 'padded' },
  args: { tags: WORKSPACE_TAGS, value: [], onChange: () => {} },
} satisfies Meta<typeof TagPicker>

export default meta
type Story = StoryObj<typeof meta>

/** The Filters dropdown: ticking narrows the contacts; a new tag is not ticked. */
export const FilterDropdown: Story = { render: () => <Filters /> }

/** A contact's tags in Edit tags and Add / Edit contact: up to 3, with chips beside the button. */
export const ContactPicker: Story = { render: () => <Picker /> }

/** Invited people: no create, rename or delete. */
export const ReadOnly: Story = {
  render: () => <TagFilterDropdown tags={WORKSPACE_TAGS} value={[2]} onChange={() => {}} />,
}
