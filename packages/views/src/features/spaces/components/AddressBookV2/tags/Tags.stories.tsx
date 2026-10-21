import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { WORKSPACE_TAGS } from '../mocks/fixtures'
import type { WorkspaceTag } from '../types'
import { TagChip, TagChips } from './TagChip'
import type { TagChoice } from './tagColor'
import TagPicker from './TagPicker'

const meta = {
  title: 'Features/Spaces/AddressBookV2/Tags',
  component: TagChip,
  parameters: { layout: 'padded' },
  args: { name: 'Vendor', color: 'cobalt' },
} satisfies Meta<typeof TagChip>

export default meta
type Story = StoryObj<typeof meta>

export const Chip: Story = {}

/** The eight colours CGW assigns, in the light-mode values (dark mode reuses them for now). */
export const AllColours: Story = {
  render: () => (
    <TagChips
      tags={(['slate', 'clay', 'rose', 'lilac', 'iris', 'cobalt', 'sky', 'lagoon'] as const).map((color) => ({
        name: color.charAt(0).toUpperCase() + color.slice(1),
        color,
      }))}
    />
  ),
}

/** A tag the workspace doesn't have yet has no colour until CGW picks one. */
export const NotSavedYet: Story = { args: { name: 'Brand new', color: undefined } }

const Picker = ({ initial, workspaceTags }: { initial: TagChoice[]; workspaceTags: WorkspaceTag[] }) => {
  const [value, setValue] = useState(initial)
  return <TagPicker value={value} onChange={setValue} workspaceTags={workspaceTags} />
}

export const PickerStory: Story = {
  name: 'Picker',
  render: () => <Picker initial={[{ name: 'Vendor', color: 'cobalt' }]} workspaceTags={WORKSPACE_TAGS} />,
}

/** Eight tags: creating a ninth shows the workspace limit. */
export const PickerWorkspaceFull: Story = {
  name: 'Picker, workspace full',
  render: () => (
    <Picker
      initial={[]}
      workspaceTags={[
        ...WORKSPACE_TAGS,
        { id: 5, name: 'Auditor', color: 'slate', contactCount: 1 },
        { id: 6, name: 'Legal', color: 'rose', contactCount: 0 },
        { id: 7, name: 'Grants', color: 'iris', contactCount: 2 },
        { id: 8, name: 'Treasury ops', color: 'sky', contactCount: 1 },
      ]}
    />
  ),
}
