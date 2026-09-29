import { render, screen } from '@/tests/test-utils'
import { Steps } from '.'

const items = [
  { id: 'create', label: 'Create', done: true },
  { id: 'review', label: 'Review', done: true },
  { id: 'confirm', label: 'Confirm', done: false },
  { id: 'execute', label: 'Execute', done: false },
]

describe('Steps', () => {
  it('renders the steps in the given order', () => {
    render(<Steps items={items} />)

    expect(screen.getAllByRole('listitem').map((step) => step.textContent)).toEqual([
      'Create',
      'Review',
      'Confirm',
      'Execute',
    ])
  })

  it('exposes reached and pending steps through data-state', () => {
    render(<Steps items={items} />)

    expect(screen.getByTestId('step-review')).toHaveAttribute('data-state', 'done')
    expect(screen.getByTestId('step-confirm')).toHaveAttribute('data-state', 'todo')
  })

  it('renders a rich label as given', () => {
    render(<Steps items={[{ id: 'confirm', label: <span>Confirm (1 of 3)</span>, done: false }]} />)

    expect(screen.getByText('Confirm (1 of 3)')).toBeInTheDocument()
  })
})
