import { render, screen, fireEvent } from '@testing-library/react'
import SpaceBackLink from './SpaceBackLink'
import { getDeterministicColor } from '@/features/spaces'

jest.mock('@/features/spaces', () => ({
  ...jest.requireActual('@/features/spaces'),
  getDeterministicColor: jest.fn((name: string) => `#${name.length.toString(16).padStart(6, '0')}`),
}))

describe('SpaceBackLink', () => {
  const mockSpace = { id: 42, name: 'Acme Corp' }

  it('renders the first letter of the space name uppercased', () => {
    render(<SpaceBackLink space={mockSpace} onClick={jest.fn()} />)

    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<SpaceBackLink space={mockSpace} onClick={handleClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('uses getDeterministicColor with space.name for the avatar background', () => {
    render(<SpaceBackLink space={mockSpace} onClick={jest.fn()} />)

    expect(getDeterministicColor).toHaveBeenCalledWith('Acme Corp')
  })

  it('handles single-character space name', () => {
    render(<SpaceBackLink space={{ id: 1, name: 'X' }} onClick={jest.fn()} />)

    expect(screen.getByText('X')).toBeInTheDocument()
  })

  it('handles lowercase space name by uppercasing the initial', () => {
    render(<SpaceBackLink space={{ id: 1, name: 'hello' }} onClick={jest.fn()} />)

    expect(screen.getByText('H')).toBeInTheDocument()
  })
})
