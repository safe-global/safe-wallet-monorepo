import { render, screen } from '@testing-library/react'
import SpaceSettingsExperimentalPage from '../../pages/spaces/settings/experimental'
import { AppRoutes } from '@/config/routes'
import * as router from 'next/router'
import * as featureModule from '@/features/__core__/useLoadFeature'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import useFeatureFlagRedirect from '@/features/spaces/hooks/useFeatureFlagRedirect'
import useFeatureRedirect from '@/features/spaces/hooks/useFeatureRedirect'
import { FEATURES } from '@safe-global/utils/utils/chains'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/features/__core__/useLoadFeature', () => ({
  useLoadFeature: jest.fn(),
}))

jest.mock('@/features/spaces/SpacesFeature', () => ({
  SpacesFeature: 'SpacesFeature',
}))
jest.mock('@/features/spaces/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: jest.fn(),
}))
jest.mock('@/features/spaces/hooks/useFeatureFlagRedirect', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('@/features/spaces/hooks/useFeatureRedirect', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const SPACE_ID = 'space-uuid-1'

const SpaceSettingsPageMock = ({ spaceId, activePage }: { spaceId: string; activePage: string }) => (
  <div data-testid="settings-page">
    {activePage} {spaceId}
  </div>
)

const setup = ({ isReady = true, spaceId = SPACE_ID }: { isReady?: boolean; spaceId?: string | null } = {}) => {
  ;(router.useRouter as jest.Mock).mockReturnValue({ isReady, query: { spaceId } })
  ;(useCurrentSpaceId as jest.Mock).mockReturnValue(spaceId)
  ;(featureModule.useLoadFeature as jest.Mock).mockReturnValue({ SpaceSettingsPage: SpaceSettingsPageMock })
}

describe('SpaceSettingsExperimentalPage (/spaces/settings/experimental)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('gates the page on WORKSPACES_EXPERIMENTAL_FEATURES, redirecting to Workspace settings', () => {
    setup()
    render(<SpaceSettingsExperimentalPage />)

    expect(useFeatureRedirect).toHaveBeenCalledWith(
      FEATURES.WORKSPACES_EXPERIMENTAL_FEATURES,
      AppRoutes.spaces.settingsGeneral,
    )
  })

  it('keeps the Spaces feature-flag redirect', () => {
    setup()
    render(<SpaceSettingsExperimentalPage />)

    expect(useFeatureFlagRedirect).toHaveBeenCalled()
  })

  it('renders the settings page on the experimental tab', () => {
    setup()
    render(<SpaceSettingsExperimentalPage />)

    expect(screen.getByTestId('settings-page')).toHaveTextContent(`experimental ${SPACE_ID}`)
  })

  it('renders nothing until the router is ready', () => {
    setup({ isReady: false })
    render(<SpaceSettingsExperimentalPage />)

    expect(screen.queryByTestId('settings-page')).not.toBeInTheDocument()
  })

  it('renders nothing without a spaceId', () => {
    setup({ spaceId: null })
    render(<SpaceSettingsExperimentalPage />)

    expect(screen.queryByTestId('settings-page')).not.toBeInTheDocument()
  })
})
