import { render, screen } from '@/tests/test-utils'
import { DrawerList } from '../DrawerList'

describe('DrawerList', () => {
  it('renders each item as a label and its content', () => {
    render(
      <DrawerList
        items={[
          { label: 'Proposer', content: 'Marc' },
          { label: 'Applies to', content: <span>Marketing</span> },
        ]}
      />,
    )

    expect(screen.getByText('Proposer')).toBeInTheDocument()
    expect(screen.getByText('Marc')).toBeInTheDocument()
    expect(screen.getByText('Applies to')).toBeInTheDocument()
    expect(screen.getByText('Marketing')).toBeInTheDocument()
  })

  it('pairs each label and value as a dt and dd inside a dl', () => {
    const { container } = render(<DrawerList items={[{ label: 'Proposer', content: 'Marc' }]} />)

    expect(container.querySelector('dl')).toBeInTheDocument()
    expect(screen.getByText('Proposer').closest('dt')).toBeInTheDocument()
    expect(screen.getByText('Marc').closest('dd')).toBeInTheDocument()
  })

  it('rules between items, never before the first', () => {
    render(
      <DrawerList
        items={[
          { label: 'Proposer', content: 'Marc' },
          { label: 'Applies to', content: 'Marketing' },
          { label: 'Initiated by', content: 'Jacob' },
        ]}
      />,
    )

    expect(screen.getAllByRole('separator', { hidden: true })).toHaveLength(2)
  })

  it('renders no rule for a single item', () => {
    render(<DrawerList items={[{ label: 'Proposer', content: 'Marc' }]} />)

    expect(screen.queryByRole('separator', { hidden: true })).not.toBeInTheDocument()
  })

  it('renders an empty list without rows', () => {
    const { container } = render(<DrawerList items={[]} />)

    expect(container.querySelector('dl')).toBeEmptyDOMElement()
  })
})
