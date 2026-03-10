import { render, screen } from '@testing-library/react'
import SimilarityWarning from './SimilarityWarning'

describe('SimilarityWarning', () => {
  it('should render similar address warning chip', () => {
    render(<SimilarityWarning />)

    expect(screen.getByTestId('similarity-warning')).toBeInTheDocument()
    expect(screen.getByText('High similarity')).toBeInTheDocument()
  })

  it('should have warning icon', () => {
    render(<SimilarityWarning />)

    // MUI Chip with icon renders the icon inside
    const chip = screen.getByTestId('similarity-warning')
    expect(chip.querySelector('svg')).toBeInTheDocument()
  })
})
