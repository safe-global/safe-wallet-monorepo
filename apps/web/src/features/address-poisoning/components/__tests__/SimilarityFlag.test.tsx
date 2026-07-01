import { render, screen } from '@testing-library/react'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import SimilarityFlag from '../SimilarityFlag'

const match = (severity: Severity): SimilarityMatch => ({
  anchor: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
  prefixLen: 4,
  suffixLen: severity === Severity.CRITICAL ? 4 : 0,
  severity,
})

describe('SimilarityFlag', () => {
  it('renders nothing without a match', () => {
    const { container } = render(<SimilarityFlag match={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the red "High risk" pill for a critical match', () => {
    render(<SimilarityFlag match={match(Severity.CRITICAL)} anchorName="My main Safe" />)
    expect(screen.getByText('High risk')).toBeInTheDocument()
    expect(screen.getByLabelText(/Looks like My main Safe.*Verify before using/i)).toBeInTheDocument()
  })

  it('renders the amber "Caution" pill for a warn match', () => {
    render(<SimilarityFlag match={match(Severity.WARN)} anchorName="My main Safe" />)
    expect(screen.getByText('Caution')).toBeInTheDocument()
    expect(screen.getByLabelText(/Shares the visible characters with My main Safe/i)).toBeInTheDocument()
  })

  it('falls back to the shortened anchor address when no name is given', () => {
    render(<SimilarityFlag match={match(Severity.CRITICAL)} />)
    expect(screen.getByLabelText(/0xa1B2\.\.\.5678/)).toBeInTheDocument()
  })
})
