import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { countTags } from '../filters'
import { WORKSPACE_CONTACTS } from '../mocks/fixtures'
import { TagChip, TagChips } from './TagChip'
import TagPicker from './TagPicker'
import { TAG_PALETTE, tagColorIndex } from './tagColor'
import { SIGNER_TAG, WORKSPACE_SAFE_TAG } from './systemTags'

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

const SAMPLE = ['Internal', 'Vendor', 'Payroll', 'DeFi', 'Exchange', 'Investor', 'Grants', 'Legal', 'Security', 'EU']

/**
 * The two automatic tags. The app adds them from workspace data: "Workspace Safe" on the
 * workspace's own Safes, "Signer of a Safe" on anyone who signs one. An icon replaces the colour
 * dot, hover explains why, and nobody can edit, rename or delete them.
 */
export const Automatic: Story = {
  render: () => (
    <TagChips
      tags={[WORKSPACE_SAFE_TAG, SIGNER_TAG, 'Treasury']}
      titles={{
        [WORKSPACE_SAFE_TAG]: 'One of this workspace’s Safes. Added automatically.',
        [SIGNER_TAG]: 'Signer of Treasury, Payroll. Added automatically.',
      }}
    />
  ),
}

/** The ten colours, one tag per colour. */
export const Palette: Story = {
  render: () => {
    const byColour = TAG_PALETTE.map((_, index) => {
      for (let n = 0; n < 500; n++) {
        const tag = SAMPLE[n] ?? `Tag ${n}`
        if (tagColorIndex(tag) === index) return tag
      }
      return `Tag ${index}`
    })
    return (
      <div className="flex flex-wrap gap-2">
        {byColour.map((tag) => (
          <TagChip key={tag} tag={tag} />
        ))}
      </div>
    )
  },
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
