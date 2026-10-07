import { render, waitFor } from '@testing-library/react'
import SpacePage from '../../pages/spaces/index'
import { AppRoutes } from '@/config/routes'
import * as router from 'next/router'
import * as featureModule from '@/features/__core__'
import * as spacesFeature from '@/features/spaces'

const mockReplace = jest.fn()

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: jest.fn(),
}))

let mockLanding: { spaceId: string | null; isLoading: boolean } = { spaceId: null, isLoading: false }
jest.mock('@/features/spaces', () => ({
  SpacesFeature: 'SpacesFeature',
  useFeatureFlagRedirect: jest.fn(),
  useLandingSpaceId: () => mockLanding,
}))

const SpaceDashboardPageMock = ({ spaceId }: { spaceId: string }) => <div data-testid="dash">space {spaceId}</div>

const setup = ({
  isReady = true,
  spaceId,
  query,
}: {
  isReady?: boolean
  spaceId?: string | string[]
  query?: Record<string, string | string[]>
}) => {
  ;(router.useRouter as jest.Mock).mockReturnValue({
    isReady,
    query: query ?? (spaceId !== undefined ? { spaceId } : {}),
    replace: mockReplace,
  })
  ;(featureModule.useLoadFeature as jest.Mock).mockReturnValue({ SpaceDashboardPage: SpaceDashboardPageMock })
  ;(spacesFeature.useFeatureFlagRedirect as jest.Mock).mockReturnValue(undefined)
}

describe('SpacePage (/spaces)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLanding = { spaceId: null, isLoading: false }
  })

  it('opens the last Workspace used when there is no spaceId', async () => {
    const landingSpaceId = '11111111-1111-1111-1111-111111111111'
    mockLanding = { spaceId: landingSpaceId, isLoading: false }
    setup({ query: { safe: 'eth:0xabc' } })

    render(<SpacePage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: AppRoutes.spaces.index,
        query: { safe: 'eth:0xabc', spaceId: landingSpaceId },
      }),
    )
  })

  it('waits for the Workspaces of the user before it redirects', () => {
    mockLanding = { spaceId: null, isLoading: true }
    setup({ spaceId: undefined })

    render(<SpacePage />)

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('redirects to /welcome/spaces when there is no spaceId and no active Workspace', async () => {
    setup({ spaceId: undefined })

    render(<SpacePage />)

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.spaces, query: {} }))
  })

  it('renders the space dashboard when spaceId is present', async () => {
    const spaceId = '11111111-1111-1111-1111-111111111111'
    setup({ spaceId })

    const { findByTestId } = render(<SpacePage />)

    expect(await findByTestId('dash')).toHaveTextContent(`space ${spaceId}`)
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('forwards safe/chain query params when redirecting', async () => {
    setup({ query: { safe: 'eth:0xabc', chain: 'eth' } })

    render(<SpacePage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: AppRoutes.welcome.spaces,
        query: { safe: 'eth:0xabc', chain: 'eth' },
      }),
    )
  })

  it('does not redirect before the router is ready', () => {
    setup({ isReady: false, spaceId: undefined })

    render(<SpacePage />)

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('treats an array spaceId (duplicate ?spaceId=…) as missing and redirects', async () => {
    setup({ query: { spaceId: ['1', '2'] } })

    const { queryByTestId } = render(<SpacePage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: AppRoutes.welcome.spaces,
        query: { spaceId: ['1', '2'] },
      }),
    )
    expect(queryByTestId('dash')).not.toBeInTheDocument()
  })

  it('treats a malformed spaceId as missing and redirects', async () => {
    setup({ query: { spaceId: 'space-7' } })

    const { queryByTestId } = render(<SpacePage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.spaces, query: { spaceId: 'space-7' } }),
    )
    expect(queryByTestId('dash')).not.toBeInTheDocument()
  })

  it('treats an empty-string spaceId as missing and redirects', async () => {
    setup({ query: { spaceId: '' } })

    render(<SpacePage />)

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: AppRoutes.welcome.spaces,
        query: { spaceId: '' },
      }),
    )
  })
})
