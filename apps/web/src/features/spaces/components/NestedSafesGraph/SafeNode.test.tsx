import { render, screen } from '@/tests/test-utils'
import { SafeNodeContent } from './SafeNode'
import type { SafeNodeData } from './useNestedSafesGraph'

const buildData = (overrides: Partial<SafeNodeData>): SafeNodeData => ({
  address: '0xAAa0000000000000000000000000000000000001',
  name: 'Treasury',
  isSpaceMember: true,
  trust: 'trusted',
  isCurrent: false,
  ...overrides,
})

describe('SafeNodeContent', () => {
  it('renders the name when present', () => {
    render(<SafeNodeContent data={buildData({ name: 'Treasury' })} />)
    expect(screen.getByText('Treasury')).toBeInTheDocument()
  })

  it('falls back to the address when there is no name', () => {
    render(<SafeNodeContent data={buildData({ name: null })} />)
    expect(screen.queryByText('Treasury')).not.toBeInTheDocument()
    expect(screen.getByTestId('safe-node')).toHaveTextContent(/0x/i)
  })

  it('shows the suspicious warning for suspicious nodes', () => {
    render(<SafeNodeContent data={buildData({ trust: 'suspicious' })} />)
    expect(screen.getByTestId('node-suspicious-icon')).toBeInTheDocument()
  })

  it('does not show the warning for trusted nodes', () => {
    render(<SafeNodeContent data={buildData({ trust: 'trusted' })} />)
    expect(screen.queryByTestId('node-suspicious-icon')).not.toBeInTheDocument()
  })

  it('marks the current node', () => {
    render(<SafeNodeContent data={buildData({ isCurrent: true })} />)
    expect(screen.getByTestId('safe-node')).toHaveAttribute('data-current', 'true')
  })

  it('renders the fiat balance when present', () => {
    render(<SafeNodeContent data={buildData({ fiatTotal: '$1.24M' })} />)
    expect(screen.getByText('$1.24M')).toBeInTheDocument()
  })
})
