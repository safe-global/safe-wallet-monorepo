import { render, screen } from '@/tests/test-utils'
import { DrawerTitle } from '../DrawerTitle'

describe('DrawerTitle', () => {
  it('renders at the small size by default', () => {
    render(<DrawerTitle>Operations Vault</DrawerTitle>)

    expect(screen.getByText('Operations Vault')).toHaveAttribute('data-variant', 'paragraph-small-bold')
  })

  it('renders at the large size when asked', () => {
    render(<DrawerTitle size="lg">Proposer role</DrawerTitle>)

    expect(screen.getByText('Proposer role')).toHaveAttribute('data-variant', 'paragraph-bold')
  })

  it('truncates rather than wrapping a long title', () => {
    render(<DrawerTitle>A title far too long for the header row</DrawerTitle>)

    expect(screen.getByText('A title far too long for the header row')).toHaveClass('truncate')
  })
})
