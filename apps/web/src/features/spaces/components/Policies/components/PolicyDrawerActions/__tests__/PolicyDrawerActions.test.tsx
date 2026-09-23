import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import PolicyDrawerActions from '../PolicyDrawerActions'

describe('PolicyDrawerActions', () => {
  it('labels the action from its prop', () => {
    render(<PolicyDrawerActions actionLabel="Review transaction" onClick={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeInTheDocument()
  })

  it('calls back when the action is clicked', async () => {
    const onClick = jest.fn()
    const { user } = renderWithUserEvent(<PolicyDrawerActions actionLabel="Submit delegation" onClick={onClick} />)

    await user.click(screen.getByRole('button', { name: 'Submit delegation' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows no hint unless one is given', () => {
    render(<PolicyDrawerActions actionLabel="Submit delegation" onClick={jest.fn()} />)

    expect(screen.queryByText(/wallet/i)).not.toBeInTheDocument()
  })

  it('explains a disabled action and does not fire it', async () => {
    const onClick = jest.fn()
    const { user } = renderWithUserEvent(
      <PolicyDrawerActions
        actionLabel="Remove proposer"
        onClick={onClick}
        disabled
        hint="Only signers of this Treasury can delete or edit this Proposer role."
      />,
    )

    expect(screen.getByText('Only signers of this Treasury can delete or edit this Proposer role.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove proposer' }))

    expect(onClick).not.toHaveBeenCalled()
  })
})
