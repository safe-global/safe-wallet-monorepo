import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import AddTrustedSafesCard from '.'

describe('AddTrustedSafesCard', () => {
  it('renders the empty-state CTA', () => {
    render(<AddTrustedSafesCard onAdd={jest.fn()} />)

    expect(screen.getByText('What are My accounts?')).toBeInTheDocument()
    expect(screen.getByText(/curated list of Safe accounts you trust/i)).toBeInTheDocument()
    expect(screen.getByText('Learn more')).toBeInTheDocument()
    expect(screen.getByTestId('add-trusted-safes-button')).toHaveTextContent('Manage list')
  })

  it('calls onAdd when the button is clicked', async () => {
    const onAdd = jest.fn()
    render(<AddTrustedSafesCard onAdd={onAdd} />)

    await userEvent.click(screen.getByTestId('add-trusted-safes-button'))

    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})
