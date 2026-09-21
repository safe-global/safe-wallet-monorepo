import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import PolicyActions from '../PolicyActions'

describe('PolicyActions', () => {
  it('labels the action from its prop', () => {
    render(<PolicyActions actionLabel="Review transaction" onClick={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeInTheDocument()
  })

  it('calls back when the action is clicked', async () => {
    const onClick = jest.fn()
    const { user } = renderWithUserEvent(<PolicyActions actionLabel="Submit delegation" onClick={onClick} />)

    await user.click(screen.getByRole('button', { name: 'Submit delegation' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
