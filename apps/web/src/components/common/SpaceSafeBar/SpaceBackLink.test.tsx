import { render, screen, fireEvent } from '@testing-library/react'
import SpaceBackLink from './SpaceBackLink'
import { getAvatarColor } from '@/features/spaces/components/Sidebar/variants/SpaceSelectorDropdown'

jest.mock('@/features/spaces/components/Sidebar/variants/SpaceSelectorDropdown', () => ({
  getAvatarColor: jest.fn((id: number) => `hsl(${id}, 55%, 55%)`),
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

  it('uses getAvatarColor with space.id for the avatar background', () => {
    render(<SpaceBackLink space={mockSpace} onClick={jest.fn()} />)

    expect(getAvatarColor).toHaveBeenCalledWith(42)
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
