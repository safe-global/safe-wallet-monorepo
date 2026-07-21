import { render, waitFor } from '@testing-library/react'
import WelcomePage from '../../pages/welcome/index'
import { AppRoutes } from '@/config/routes'
import * as router from 'next/router'
import * as local from '@/services/local-storage/local'

const mockReplace = jest.fn()

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/services/local-storage/local', () => ({
  __esModule: true,
  ...jest.requireActual('@/services/local-storage/local'),
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}))

const setup = ({
  isReady = true,
  pathname = AppRoutes.welcome.index,
  query = {} as Record<string, string>,
  addedSafes,
}: {
  isReady?: boolean
  pathname?: string
  query?: Record<string, string>
  addedSafes?: unknown
} = {}) => {
  ;(router.useRouter as jest.Mock).mockReturnValue({ isReady, pathname, query, replace: mockReplace })
  ;(local.default.getItem as jest.Mock).mockReturnValue(addedSafes ?? null)
}

describe('WelcomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to the Workspaces tab when no safes are added', async () => {
    setup({ addedSafes: null })

    render(<WelcomePage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.spaces, query: undefined }),
    )
  })

  it('redirects to the Trusted accounts tab when safes are added', async () => {
    setup({ addedSafes: { '1': { '0x123': {} } } })

    render(<WelcomePage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.accounts, query: undefined }),
    )
  })

  it('forwards ?chain= to the redirect target', async () => {
    setup({ addedSafes: null, query: { chain: 'eth' } })

    render(<WelcomePage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.spaces, query: { chain: 'eth' } }),
    )
  })

  it('does not redirect before the router is ready', () => {
    setup({ isReady: false })

    render(<WelcomePage />)

    expect(mockReplace).not.toHaveBeenCalled()
  })
})
