import { render, screen } from '@testing-library/react'
import AccountsNavigation from '../index'

const mockUseHasFeature = jest.fn()

jest.mock('next/router', () => ({ useRouter: () => ({ pathname: '/welcome/spaces' }) }))
jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => mockUseHasFeature() }))
jest.mock('@/public/images/safe-pro/pro-wordmark.svg', () => 'svg')

describe('AccountsNavigation', () => {
  it.each([
    [true, 1],
    [false, 0],
  ])('shows the Pro chip on the Workspaces tab only when SAFE_PRO is on (%s)', (enabled, count) => {
    mockUseHasFeature.mockReturnValue(enabled)

    render(<AccountsNavigation />)

    expect(screen.queryAllByTestId('pro-chip')).toHaveLength(count)
  })
})
