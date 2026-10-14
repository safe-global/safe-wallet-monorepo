import { render, screen } from '@testing-library/react'
import { TagChip, TagChips } from '../TagChip'
import { tagColor } from '../tagColor'

describe('TagChip', () => {
  it('renders the tag with its palette colour', () => {
    render(<TagChip tag="Vendor" />)

    const chip = screen.getByTestId('tag-chip')
    expect(chip).toHaveTextContent('Vendor')
    expect(chip).toHaveClass(...tagColor('Vendor').fill.split(' '))
    expect(chip.querySelector('span[aria-hidden="true"]')).toHaveClass(tagColor('Vendor').dot)
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
})
