import { render, screen } from '@/tests/test-utils'
import { DrawerActions } from '../DrawerActions'

describe('DrawerActions', () => {
  it('lets a single action fill the row', () => {
    render(<DrawerActions primary={<button>Sign</button>} />)

    expect(screen.getByRole('button', { name: 'Sign' }).parentElement).not.toHaveClass('grid-cols-[1fr_2fr]')
  })

  it('puts the secondary first and gives the primary two thirds of the row', () => {
    render(<DrawerActions secondary={<button>Reject</button>} primary={<button>Sign</button>} />)

    const [first, second] = screen.getAllByRole('button')

    expect(first).toHaveTextContent('Reject')
    expect(second).toHaveTextContent('Sign')
    expect(first.parentElement).toHaveClass('grid-cols-[1fr_2fr]')
  })
})
