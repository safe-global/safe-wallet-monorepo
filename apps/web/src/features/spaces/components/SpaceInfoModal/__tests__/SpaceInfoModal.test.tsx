import { render, screen, fireEvent } from '@testing-library/react'
import SpaceInfoModal from '../index'

describe('SpaceInfoModal', () => {
  it('renders the workspaces headline and benefits', () => {
    render(<SpaceInfoModal onClose={jest.fn()} />)

    expect(screen.getByText('One workspace for your team.')).toBeInTheDocument()
    expect(screen.getByText('Every Safe in one view')).toBeInTheDocument()
    expect(screen.getByText('Access by role')).toBeInTheDocument()
    expect(screen.getByText('Security & audit in one view')).toBeInTheDocument()
  })

  it('links to the workspaces help article', () => {
    render(<SpaceInfoModal onClose={jest.fn()} />)

    expect(screen.getByRole('link', { name: /learn more/i })).toHaveAttribute(
      'href',
      expect.stringContaining('help.safe.global'),
    )
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn()
    render(<SpaceInfoModal onClose={onClose} />)

    fireEvent.click(screen.getAllByRole('button', { name: /close/i })[0])

    expect(onClose).toHaveBeenCalled()
  })
})
