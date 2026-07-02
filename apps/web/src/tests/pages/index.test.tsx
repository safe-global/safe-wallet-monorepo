import { render, waitFor } from '@testing-library/react'
import IndexPage from '../../pages/index'
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
  pathname = AppRoutes.index,
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

describe('IndexPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('lands on the Workspaces tab when no safes are added', async () => {
    setup({ addedSafes: null })

    render(<IndexPage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.spaces, query: undefined }),
    )
  })

  it('forwards ?chain= when redirecting to the Workspaces tab', async () => {
    setup({ addedSafes: null, query: { chain: 'eth' } })

    render(<IndexPage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.spaces, query: { chain: 'eth' } }),
    )
  })

  it('lands on the Trusted accounts tab when safes are added', async () => {
    setup({ addedSafes: { '1': { '0x123': {} } } })

    render(<IndexPage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.accounts, query: undefined }),
    )
  })

  it('does not redirect before the router is ready', () => {
    setup({ isReady: false })

    render(<IndexPage />)

    expect(mockReplace).not.toHaveBeenCalled()
  })
})
