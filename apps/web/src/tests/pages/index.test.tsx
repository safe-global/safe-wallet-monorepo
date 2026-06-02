import { render, screen, waitFor } from '@testing-library/react'
import IndexPage from '../../pages/index'
import { AppRoutes } from '@/config/routes'
import * as router from 'next/router'
import * as useIsRequireLoginEnabledModule from '@/hooks/useIsRequireLoginEnabled'
import * as local from '@/services/local-storage/local'

const mockReplace = jest.fn()

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/hooks/useIsRequireLoginEnabled', () => ({
  useIsRequireLoginEnabled: jest.fn(),
}))

jest.mock('@/services/local-storage/local', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}))

jest.mock('@/features/spaces/components/SpacesLogin', () => ({
  __esModule: true,
  default: () => <div data-testid="spaces-login" />,
}))

const setup = ({
  isReady = true,
  pathname = AppRoutes.index,
  query = {} as Record<string, string>,
  isRequireLoginEnabled,
  addedSafes,
}: {
  isReady?: boolean
  pathname?: string
  query?: Record<string, string>
  isRequireLoginEnabled: boolean | undefined
  addedSafes?: unknown
}) => {
  ;(router.useRouter as jest.Mock).mockReturnValue({ isReady, pathname, query, replace: mockReplace })
  ;(useIsRequireLoginEnabledModule.useIsRequireLoginEnabled as jest.Mock).mockReturnValue(isRequireLoginEnabled)
  ;(local.default.getItem as jest.Mock).mockReturnValue(addedSafes ?? null)
}

describe('IndexPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders SpacesLogin inline (no redirect) when the require-login gate is on', () => {
    setup({ isRequireLoginEnabled: true })

    render(<IndexPage />)

    expect(screen.getByTestId('spaces-login')).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('uses legacy /welcome behaviour when the gate is off and no safes added', async () => {
    setup({ isRequireLoginEnabled: false, addedSafes: null })

    render(<IndexPage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.index, query: undefined }),
    )
  })

  it('forwards ?chain= when redirecting to /welcome on gate off', async () => {
    setup({ isRequireLoginEnabled: false, addedSafes: null, query: { chain: 'eth' } })

    render(<IndexPage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.index, query: { chain: 'eth' } }),
    )
  })

  it('uses legacy /welcome/accounts behaviour when the gate is off and safes are added', async () => {
    setup({ isRequireLoginEnabled: false, addedSafes: { '1': { '0x123': {} } } })

    render(<IndexPage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.accounts, query: undefined }),
    )
  })

  it('does not redirect while the feature flag is still resolving', () => {
    setup({ isRequireLoginEnabled: undefined })

    render(<IndexPage />)

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('does not redirect before the router is ready', () => {
    setup({ isRequireLoginEnabled: false, isReady: false })

    render(<IndexPage />)

    expect(mockReplace).not.toHaveBeenCalled()
  })
})
