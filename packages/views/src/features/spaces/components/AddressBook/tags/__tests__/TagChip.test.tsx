import { render, screen } from '@testing-library/react'
import { TagChip, TagChips } from '../TagChip'
import { tagColor } from '../tagColor'
import { SIGNER_TAG, WORKSPACE_SAFE_TAG } from '../systemTags'

describe('TagChip', () => {
  it('renders the tag with its palette colour', () => {
    render(<TagChip tag="Vendor" />)

    const chip = screen.getByTestId('tag-chip')
    expect(chip).toHaveTextContent('Vendor')
    expect(chip).toHaveClass(...tagColor('Vendor').fill.split(' '))
    expect(chip.querySelector('span[aria-hidden="true"]')).toHaveClass(tagColor('Vendor').dot)
    expect(screen.queryByTestId('system-tag-chip')).not.toBeInTheDocument()
  })

  it.each([WORKSPACE_SAFE_TAG, SIGNER_TAG, 'workspace safe'])('renders %s as an automatic tag', (tag) => {
    render(<TagChip tag={tag} />)

    expect(screen.getByTestId('system-tag-chip')).toHaveTextContent(tag)
    expect(screen.queryByTestId('tag-chip')).not.toBeInTheDocument()
  })
})

describe('TagChips', () => {
  it('renders nothing for an empty list', () => {
    const { container } = render(<TagChips tags={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows up to three chips and folds the rest into +N', () => {
    render(<TagChips tags={['A', 'B', 'C', 'D', 'E']} />)

    expect(screen.getAllByTestId('tag-chip')).toHaveLength(3)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('renders automatic and team tags side by side', () => {
    render(<TagChips tags={[SIGNER_TAG, 'Vendor']} titles={{ [SIGNER_TAG]: 'Signer of Treasury' }} />)

    expect(screen.getByTestId('system-tag-chip')).toHaveTextContent(SIGNER_TAG)
    expect(screen.getByTestId('tag-chip')).toHaveTextContent('Vendor')
  })
})
