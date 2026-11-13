import { render, screen } from '@/tests/test-utils'
import { PrototypeFrame } from './PrototypeFrame'

jest.mock('@/hooks/useLogout', () => () => {
  throw new Error('The design preview must not load authentication actions')
})

describe('prototype workspace isolation', () => {
  it('renders presentation-only navigation without live account actions', () => {
    render(<PrototypeFrame>Preview content</PrototypeFrame>)
    expect(screen.getByText('Preview content')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Preview account' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Global search unavailable in preview' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Connect wallet' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create workspace' })).not.toBeInTheDocument()
  })
})
