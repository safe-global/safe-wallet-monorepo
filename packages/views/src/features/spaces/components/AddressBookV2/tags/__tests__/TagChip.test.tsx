import { render, screen } from '@testing-library/react'
import { buildSpaceAddressBookTags, spaceAddressBookTagBuilder } from '@/tests/builders/space'
import { TagChip, TagChips } from '../TagChip'
import { TAG_COLOR_CLASSES, pickFreeColor, toTagChoices, toTagRequest } from '../tagColor'

describe('TagChip', () => {
  it('uses the colour CGW stored for the tag', () => {
    const tag = spaceAddressBookTagBuilder().with({ color: 'lagoon' }).build()
    render(<TagChip name={tag.name} color={tag.color} />)

    expect(screen.getByTestId('tag-chip')).toHaveClass(...TAG_COLOR_CLASSES.lagoon.chip.split(' '))
  })

  it('is neutral for a tag CGW has not coloured yet', () => {
    render(<TagChip name="Brand new" />)

    expect(screen.getByTestId('tag-chip')).toHaveClass('bg-muted')
  })
})

describe('TagChips', () => {
  it('renders nothing without tags', () => {
    const { container } = render(<TagChips tags={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows every tag in order', () => {
    render(<TagChips tags={[{ name: 'Vendor' }, { name: 'EU' }]} />)

    expect(screen.getAllByTestId('tag-chip').map((chip) => chip.textContent)).toEqual(['Vendor', 'EU'])
  })
})

describe('toTagChoices', () => {
  it('takes the colour and spelling of the matching workspace tag, ignoring case, and drops unknown names', () => {
    const vendor = spaceAddressBookTagBuilder().with({ name: 'Vendor' }).build()

    expect(toTagChoices(['vendor', 'Gone'], [vendor])).toEqual([{ name: 'Vendor', color: vendor.color }])
  })
})

describe('toTagRequest', () => {
  it('sends every name and the colours of the tags the workspace does not have yet', () => {
    const vendor = spaceAddressBookTagBuilder().with({ name: 'Vendor', color: 'cobalt' }).build()

    expect(
      toTagRequest(
        [
          { name: 'Vendor', color: 'cobalt' },
          { name: 'EU', color: 'rose' },
        ],
        [vendor],
      ),
    ).toEqual({ tags: ['Vendor', 'EU'], tagColors: [{ name: 'EU', color: 'rose' }] })
  })
})

describe('pickFreeColor', () => {
  it('picks a colour none of the given ones is', () => {
    const taken = buildSpaceAddressBookTags(7).map((tag) => tag.color)

    const color = pickFreeColor(taken)

    expect(Object.keys(TAG_COLOR_CLASSES)).toContain(color)
    expect(taken).not.toContain(color)
  })

  it('has nothing to pick once every colour is taken', () => {
    expect(pickFreeColor(buildSpaceAddressBookTags(8).map((tag) => tag.color))).toBeUndefined()
  })
})
