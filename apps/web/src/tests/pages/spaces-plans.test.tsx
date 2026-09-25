import { render, screen } from '@testing-library/react'
import SpacePlansPage from '../../pages/spaces/plans'
import { AppRoutes } from '@/config/routes'
import * as router from 'next/router'
import * as featureModule from '@/features/__core__'

const mockPush = jest.fn()
const mockUseIsSafeProAnnouncementEnabled = jest.fn<boolean, []>()
const mockUseIsSafeProEnabled = jest.fn<boolean | undefined, []>()

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: jest.fn(),
}))

jest.mock('@/features/spaces', () => ({
  ...jest.requireActual<Record<string, unknown>>('@/features/spaces/hooks/useFeatureRedirect'),
  SpacesFeature: 'SpacesFeature',
  useFeatureFlagRedirect: jest.fn(),
}))

jest.mock('@/features/safe-pro-announcement', () => ({
  useIsSafeProAnnouncementEnabled: () => mockUseIsSafeProAnnouncementEnabled(),
}))

jest.mock('@/hooks/useIsSafeProEnabled', () => ({
  useIsSafeProEnabled: () => mockUseIsSafeProEnabled(),
}))

const SPACE_ID = 'space-uuid-1'

const SpacePlansPageMock = ({ spaceId }: { spaceId: string }) => <div data-testid="plans">plans {spaceId}</div>

const setup = ({ isAnnounced, isSafePro }: { isAnnounced: boolean; isSafePro: boolean | undefined }) => {
  ;(router.useRouter as jest.Mock).mockReturnValue({ isReady: true, query: { spaceId: SPACE_ID }, push: mockPush })
  ;(featureModule.useLoadFeature as jest.Mock).mockReturnValue({ SpacePlansPage: SpacePlansPageMock })
  mockUseIsSafeProAnnouncementEnabled.mockReturnValue(isAnnounced)
  mockUseIsSafeProEnabled.mockReturnValue(isSafePro)
}

describe('SpacePlansPage (/spaces/plans)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to the spaces index, preserving the spaceId, when both Safe Pro flags are off', () => {
    setup({ isAnnounced: false, isSafePro: false })

    render(<SpacePlansPage />)

    expect(mockPush).toHaveBeenCalledWith({ pathname: AppRoutes.spaces.index, query: { spaceId: SPACE_ID } })
  })

  it.each([
    { name: 'Safe Pro is only announced', isAnnounced: true, isSafePro: false },
    { name: 'Safe Pro is only live', isAnnounced: false, isSafePro: true },
    { name: 'the chain config is still loading', isAnnounced: false, isSafePro: undefined },
  ])('renders the plans page without redirecting when $name', ({ isAnnounced, isSafePro }) => {
    setup({ isAnnounced, isSafePro })

    render(<SpacePlansPage />)

    expect(mockPush).not.toHaveBeenCalled()
    expect(screen.getByTestId('plans')).toHaveTextContent(`plans ${SPACE_ID}`)
  })
})
