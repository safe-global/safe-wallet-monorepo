import { render, screen, fireEvent } from '@testing-library/react'
import { Chip } from './chip'
import { Badge } from './badge'

describe('Chip', () => {
  it('renders its label', () => {
    render(<Chip>Pending</Chip>)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('does not render a delete button without onDelete', () => {
    render(<Chip>Static</Chip>)
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })

  it('fires onDelete when the delete button is clicked', () => {
    const onDelete = jest.fn()
    render(<Chip onDelete={onDelete}>Removable</Chip>)
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})

describe('Badge', () => {
  it('exposes the variant via a data attribute', () => {
    render(<Badge variant="success">Success</Badge>)
    expect(screen.getByText('Success')).toHaveAttribute('data-variant', 'success')
  })
})
