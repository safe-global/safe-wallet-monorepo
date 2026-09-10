import { fireEvent, render, screen } from '@/tests/test-utils'
import SafeProLockedWorkspace from '../index'

const plansHref = { pathname: '/spaces/plans', query: { spaceId: 'space-1' } }

describe('SafeProLockedWorkspace', () => {
  it('tells a migrated Workspace about its 60-day grace', () => {
    render(<SafeProLockedWorkspace trialDays={60} onStartTrial={jest.fn()} plansHref={plansHref} />)

    expect(screen.getByRole('heading', { name: /Your Workspace moved to Safe Pro on Oct 6, 2026/ })).toBeInTheDocument()
    expect(screen.getByText(/your trial is 60 days instead of 30/)).toBeInTheDocument()
  })

  it('offers a new Workspace the standard trial', () => {
    const onStartTrial = jest.fn()
    render(<SafeProLockedWorkspace trialDays={30} onStartTrial={onStartTrial} plansHref={plansHref} />)

    expect(screen.getByRole('heading', { name: /Your Workspace is ready for Safe Pro/ })).toBeInTheDocument()
    expect(screen.getByText(/Start your 30-day free trial/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Start free trial/ }))
    expect(onStartTrial).toHaveBeenCalled()
  })

  it('sends a Workspace with no trial left to the Plans page instead', () => {
    render(<SafeProLockedWorkspace trialDays={null} onStartTrial={jest.fn()} plansHref={plansHref} />)

    expect(screen.getByRole('heading', { name: /Your Safe Pro Workspace is locked/ })).toBeInTheDocument()
    expect(screen.getByText(/Choose a plan to unlock it/)).toBeInTheDocument()
    expect(screen.queryByText(/Start free trial/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /See plans/ })).toHaveAttribute('href', '/spaces/plans?spaceId=space-1')
  })
})
