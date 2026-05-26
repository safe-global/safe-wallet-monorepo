import { render, waitFor } from '@testing-library/react'
import WelcomePage from '../../pages/welcome/index'
import { AppRoutes } from '@/config/routes'
import * as router from 'next/router'
import * as useIsRequireLoginEnabledModule from '@/hooks/useIsRequireLoginEnabled'

const mockReplace = jest.fn()

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/hooks/useIsRequireLoginEnabled', () => ({
  useIsRequireLoginEnabled: jest.fn(),
}))

jest.mock('@/components/welcome/NewSafe', () => ({
  __esModule: true,
  default: () => <div data-testid="legacy-welcome" />,
}))

const setup = (
  isRequireLoginEnabled: boolean | undefined,
  query: Record<string, string> = {},
  pathname: string = AppRoutes.welcome.index,
) => {
  ;(router.useRouter as jest.Mock).mockReturnValue({ isReady: true, pathname, query, replace: mockReplace })
  ;(useIsRequireLoginEnabledModule.useIsRequireLoginEnabled as jest.Mock).mockReturnValue(isRequireLoginEnabled)
}

describe('WelcomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the legacy welcome screen when the gate is off', () => {
    setup(false)

    const { getByTestId } = render(<WelcomePage />)

    expect(getByTestId('legacy-welcome')).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('redirects to /welcome/spaces when the gate is on', async () => {
    setup(true)

    const { queryByTestId } = render(<WelcomePage />)

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.spaces, query: {} }))
    expect(queryByTestId('legacy-welcome')).not.toBeInTheDocument()
  })

  it('preserves next/safe/chain query params when redirecting under the gate', async () => {
    setup(true, { next: '/balances?safe=eth%3A0xabc', safe: 'eth:0xabc', chain: 'eth' })

    render(<WelcomePage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: AppRoutes.welcome.spaces,
        query: { next: '/balances?safe=eth%3A0xabc', safe: 'eth:0xabc', chain: 'eth' },
      }),
    )
  })

  it('renders nothing while the gate flag is still loading (no legacy-UI flash)', () => {
    setup(undefined)

    const { queryByTestId } = render(<WelcomePage />)

    expect(queryByTestId('legacy-welcome')).not.toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
