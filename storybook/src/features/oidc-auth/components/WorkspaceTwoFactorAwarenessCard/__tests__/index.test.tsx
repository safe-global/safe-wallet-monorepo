import { fireEvent, render, screen } from '@/tests/test-utils'
import WorkspaceTwoFactorAwarenessCard from '../index'

describe('WorkspaceTwoFactorAwarenessCard', () => {
  it('renders the headline and the supporting line', () => {
    render(<WorkspaceTwoFactorAwarenessCard onDismiss={jest.fn()} />)

    expect(screen.getByText('Protect your Workspace with 2FA')).toBeInTheDocument()
    expect(screen.getByText('A second factor is required on all sensitive actions.')).toBeInTheDocument()
  })

  it('points Continue at the general settings of the current space', () => {
    render(<WorkspaceTwoFactorAwarenessCard spaceId="space-uuid" onDismiss={jest.fn()} />)

    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute(
      'href',
      '/spaces/settings/general?spaceId=space-uuid',
    )
  })

  it('points Continue at the general settings page when no space is known', () => {
    render(<WorkspaceTwoFactorAwarenessCard onDismiss={jest.fn()} />)

    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute('href', '/spaces/settings/general')
  })

  it('calls onDismiss from the close button', () => {
    const onDismiss = jest.fn()
    render(<WorkspaceTwoFactorAwarenessCard onDismiss={onDismiss} />)

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
