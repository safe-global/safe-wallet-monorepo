import { getWelcomeRoute } from '../getWelcomeRoute'
import { AppRoutes } from '@/config/routes'
import * as local from '@/services/local-storage/local'

jest.mock('@/services/local-storage/local', () => ({
  __esModule: true,
  ...jest.requireActual('@/services/local-storage/local'),
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}))

describe('getWelcomeRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the Trusted accounts tab when safes are added', () => {
    ;(local.default.getItem as jest.Mock).mockReturnValue({ '1': { '0x123': {} } })

    expect(getWelcomeRoute()).toBe(AppRoutes.welcome.accounts)
  })

  it('returns the Workspaces tab when there are no added safes', () => {
    ;(local.default.getItem as jest.Mock).mockReturnValue(null)

    expect(getWelcomeRoute()).toBe(AppRoutes.welcome.spaces)
  })

  it('returns the Workspaces tab when the added safes object is empty', () => {
    ;(local.default.getItem as jest.Mock).mockReturnValue({})

    expect(getWelcomeRoute()).toBe(AppRoutes.welcome.spaces)
  })
})
