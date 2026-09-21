import { render, screen } from '@/tests/test-utils'
import SafeSignatureInfo from '../SafeSignatureInfo'

const SAFE = { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', name: 'Ops', threshold: 3 }

describe('SafeSignatureInfo', () => {
  it('names the Safe and how many signatures it still needs', () => {
    render(<SafeSignatureInfo safe={SAFE} signatures={2} />)

    expect(screen.getByText('Parent Safe account')).toBeInTheDocument()
    expect(screen.getByTestId('safe-signature-progress')).toHaveTextContent('2 of 3 signed')
    expect(screen.getByText('Ops')).toBeInTheDocument()
  })

  it('falls back to the shortened address when the Safe has no name', () => {
    render(<SafeSignatureInfo safe={{ address: SAFE.address, threshold: 2 }} signatures={0} />)

    expect(screen.getByTestId('safe-signature-progress')).toHaveTextContent('0 of 2 signed')
    expect(screen.queryByText('Ops')).not.toBeInTheDocument()
  })

  it('keeps the progress badge on the warning tint below the threshold', () => {
    render(<SafeSignatureInfo safe={SAFE} signatures={2} />)

    const badge = screen.getByTestId('safe-signature-progress')
    expect(badge).toHaveClass('bg-badge-warning-subtle')
    expect(badge).not.toHaveClass('bg-success-subtle')
  })

  it('switches the progress badge to the success tint once the threshold is reached', () => {
    render(<SafeSignatureInfo safe={SAFE} signatures={SAFE.threshold} />)

    const badge = screen.getByTestId('safe-signature-progress')
    expect(badge).toHaveClass('bg-success-subtle')
    expect(badge).not.toHaveClass('bg-badge-warning-subtle')
  })

  it('stays on the success tint when more signatures than the threshold are collected', () => {
    render(<SafeSignatureInfo safe={SAFE} signatures={SAFE.threshold + 1} />)

    expect(screen.getByTestId('safe-signature-progress')).toHaveClass('bg-success-subtle')
  })

  it('takes a custom label', () => {
    render(<SafeSignatureInfo safe={SAFE} signatures={1} label="Signing Safe account" />)

    expect(screen.getByText('Signing Safe account')).toBeInTheDocument()
    expect(screen.queryByText('Parent Safe account')).not.toBeInTheDocument()
  })

  it('turns the progress green once the threshold is met', () => {
    render(<SafeSignatureInfo safe={SAFE} signatures={3} />)

    expect(screen.getByTestId('safe-signature-progress')).toHaveAttribute('data-variant', 'success')
  })

  it('marks stalled progress as failed rather than in-flight', () => {
    render(<SafeSignatureInfo safe={SAFE} signatures={2} badgeVariant="destructive" />)

    expect(screen.getByTestId('safe-signature-progress')).toHaveAttribute('data-variant', 'destructive')
  })
})
