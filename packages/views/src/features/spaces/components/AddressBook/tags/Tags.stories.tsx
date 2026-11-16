import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { countTags } from '../filters'
import { WORKSPACE_CONTACTS } from '../mocks/fixtures'
import { TagChip, TagChips } from './TagChip'
import TagPicker from './TagPicker'
import { cn } from '@safe-global/views/utils/cn'
import { TAG_PALETTE } from './tagColor'

/**
 * Tags are team-written labels: a colour dot on a soft fill, square corners, so they never read as a
 * system chip. The colour is a hash of the name, so a tag looks the same everywhere.
 */
const meta = {
  title: 'Features/Spaces/AddressBook/Tags',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** The eight tag colours from the Safe{Wallet} colour system, by name. */
export const Palette: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {TAG_PALETTE.map((color) => (
        <span
          key={color.name}
          className={cn('inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs font-medium', color.fill)}
        >
          <span aria-hidden="true" className={cn('size-1.5 rounded-full', color.dot)} />
          {color.name}
        </span>
      ))}
    </div>
  ),
}

/** The tags used in the Lumen Labs book. */
export const BookTags: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {countTags(WORKSPACE_CONTACTS).map(({ tag }) => (
        <TagChip key={tag} tag={tag} />
      ))}
    </div>
  ),
}

/** In the table: three chips, then "+N" with the rest on hover. */
export const Overflow: Story = {
  render: () => <TagChips tags={['Exchange', 'Whitelisted', 'Recurring', 'US', 'Priority']} />,
}

/** Pick from the book's tags or type a new one. Invalid names are explained before saving. */
export const Picker: Story = {
  render: () => {
    const [tags, setTags] = useState(['Vendor'])
    return (
      <div className="flex flex-wrap items-center gap-2">
        <TagPicker value={tags} onChange={setTags} options={countTags(WORKSPACE_CONTACTS)} />
        <TagChips tags={tags} maxVisible={10} />
      </div>
    )
  },
}
