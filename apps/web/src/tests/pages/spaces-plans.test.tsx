import { render, screen } from '@testing-library/react'
import SpacePlansPage from '../../pages/spaces/plans'
import { AppRoutes } from '@/config/routes'
import * as router from 'next/router'
import * as featureModule from '@/features/__core__'
import * as spacesFeature from '@/features/spaces'

const mockUseIsSafeProAnnouncementEnabled = jest.fn<boolean, []>()
const mockUseIsSafeProEnabled = jest.fn<boolean | undefined, []>()

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: jest.fn(),
}))

jest.mock('@/features/spaces', () => ({
  SpacesFeature: 'SpacesFeature',
  useFeatureFlagRedirect: jest.fn(),
  useRedirectWhenOff: jest.fn(),
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
  ;(router.useRouter as jest.Mock).mockReturnValue({ isReady: true, query: { spaceId: SPACE_ID } })
  ;(featureModule.useLoadFeature as jest.Mock).mockReturnValue({ SpacePlansPage: SpacePlansPageMock })
  mockUseIsSafeProAnnouncementEnabled.mockReturnValue(isAnnounced)
  mockUseIsSafeProEnabled.mockReturnValue(isSafePro)
}

describe('SpacePlansPage (/spaces/plans)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    { name: 'both Safe Pro flags are off', isAnnounced: false, isSafePro: false, isOn: false },
    { name: 'Safe Pro is only announced', isAnnounced: true, isSafePro: false, isOn: true },
    { name: 'Safe Pro is only live', isAnnounced: false, isSafePro: true, isOn: true },
    { name: 'the chain config is still loading', isAnnounced: false, isSafePro: undefined, isOn: undefined },
  ])('hands $isOn to the spaces-index redirect when $name', ({ isAnnounced, isSafePro, isOn }) => {
    setup({ isAnnounced, isSafePro })

    render(<SpacePlansPage />)

    expect(spacesFeature.useRedirectWhenOff).toHaveBeenCalledWith(isOn, AppRoutes.spaces.index)
  })

  it('renders the plans page for the spaceId in the query', () => {
    setup({ isAnnounced: true, isSafePro: false })

    render(<SpacePlansPage />)

    expect(screen.getByTestId('plans')).toHaveTextContent(`plans ${SPACE_ID}`)
  })
})
