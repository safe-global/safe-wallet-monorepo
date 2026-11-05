import { render, screen } from '@testing-library/react'
import { buildSpaceAddressBookTags, spaceAddressBookTagBuilder } from '@/tests/builders/space'
import { TagChip, TagChips } from '../TagChip'
import { TAG_COLOR_CLASSES } from '../tagColor'

describe('TagChip', () => {
  it('uses the colour CGW stored for the tag', () => {
    const tag = spaceAddressBookTagBuilder().with({ color: 'lagoon' }).build()
    render(<TagChip name={tag.name} color={tag.color} />)

    expect(screen.getByTestId('tag-chip')).toHaveClass(...TAG_COLOR_CLASSES.lagoon.chip.split(' '))
  })
})

describe('TagChips', () => {
  it('renders nothing without tags', () => {
    const { container } = render(<TagChips tags={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows every tag in order', () => {
    const tags = buildSpaceAddressBookTags(2)
    render(<TagChips tags={tags} />)

    expect(screen.getAllByTestId('tag-chip').map((chip) => chip.textContent)).toEqual(tags.map((tag) => tag.name))
  })
})
