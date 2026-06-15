import { render } from '@testing-library/react'
import * as router from 'next/router'
import { AppRoutes } from '@/config/routes'
import LoginPage from '../../pages/login'

const mockReplace = jest.fn(() => Promise.resolve(true))

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

const setupRouter = ({
  isReady = true,
  pathname = AppRoutes.login,
  query = {},
}: {
  isReady?: boolean
  pathname?: string
  query?: Record<string, string>
} = {}) => {
  ;(router.useRouter as jest.Mock).mockReturnValue({ isReady, pathname, query, replace: mockReplace })
}

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to /welcome/spaces, dropping the Auth0 iss param', () => {
    setupRouter({ query: { iss: 'https://example.auth0.com/' } })

    const { container } = render(<LoginPage />)

    expect(mockReplace).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
    expect(container).toBeEmptyDOMElement()
  })

  it('does nothing until the router is ready', () => {
    setupRouter({ isReady: false, query: { iss: 'https://example.auth0.com/' } })

    render(<LoginPage />)

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('does nothing when mounted on a different pathname', () => {
    setupRouter({ pathname: AppRoutes.welcome.spaces })

    render(<LoginPage />)

    expect(mockReplace).not.toHaveBeenCalled()
  })
})
