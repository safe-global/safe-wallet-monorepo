import { render, screen, fireEvent } from '@testing-library/react'
import AddressSimilarityWarning from './index'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'

const matchWith = (severity: Severity): SimilarityMatch => ({
  anchor: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
  prefixLen: 4,
  suffixLen: severity === Severity.CRITICAL ? 4 : 0,
  severity,
})

describe('AddressSimilarityWarning', () => {
  it('renders the critical (both-ends) message', () => {
    render(<AddressSimilarityWarning match={matchWith(Severity.CRITICAL)} />)
    expect(screen.getByTestId('address-similarity-warning')).toBeInTheDocument()
    expect(screen.getByText(/looks almost identical to one you trust/i)).toBeInTheDocument()
  })

  it('renders the softer one-end (warn) message', () => {
    render(<AddressSimilarityWarning match={matchWith(Severity.WARN)} />)
    expect(screen.getByText(/resembles a trusted address/i)).toBeInTheDocument()
  })

  it('invokes onReview when the compare action is clicked', () => {
    const onReview = jest.fn()
    render(<AddressSimilarityWarning match={matchWith(Severity.CRITICAL)} onReview={onReview} />)
    fireEvent.click(screen.getByTestId('address-similarity-review'))
    expect(onReview).toHaveBeenCalledTimes(1)
  })

  it('omits the compare action when no onReview is provided', () => {
    render(<AddressSimilarityWarning match={matchWith(Severity.WARN)} />)
    expect(screen.queryByTestId('address-similarity-review')).not.toBeInTheDocument()
  })
})
