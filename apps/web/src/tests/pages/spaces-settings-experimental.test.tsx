import { render, screen } from '@testing-library/react'
import SpaceSettingsExperimentalPage from '../../pages/spaces/settings/experimental'
import { AppRoutes } from '@/config/routes'
import * as router from 'next/router'
import * as spacesFeatureUseCurrentSpaceId from '@/features/spaces/public/hooks/useCurrentSpaceId'
import * as spacesFeatureUseFeatureRedirect from '@/features/spaces/public/hooks/useFeatureRedirect'
import { FEATURES } from '@safe-global/utils/utils/chains'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/features/spaces/public/components/SpaceSettingsPage', () => ({
  __esModule: true,
  default: ({ spaceId, activePage }: { spaceId: string; activePage: string }) => (
    <div data-testid="settings-page">
      {activePage} {spaceId}
    </div>
  ),
}))
jest.mock('@/features/spaces/public/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: jest.fn(),
}))
jest.mock('@/features/spaces/public/hooks/useFeatureRedirect', () => ({
  ...jest.requireActual('@/features/spaces/public/hooks/useFeatureRedirect'),
  __esModule: true,
  default: jest.fn(),
}))

const SPACE_ID = 'space-uuid-1'

const setup = ({ isReady = true, spaceId = SPACE_ID }: { isReady?: boolean; spaceId?: string | null } = {}) => {
  ;(router.useRouter as jest.Mock).mockReturnValue({ isReady, query: { spaceId } })
  ;(spacesFeatureUseCurrentSpaceId.useCurrentSpaceId as jest.Mock).mockReturnValue(spaceId)
}

describe('SpaceSettingsExperimentalPage (/spaces/settings/experimental)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('gates the page on WORKSPACES_EXPERIMENTAL_FEATURES, redirecting to Workspace settings', () => {
    setup()
    render(<SpaceSettingsExperimentalPage />)

    expect(spacesFeatureUseFeatureRedirect.default).toHaveBeenCalledWith(
      FEATURES.WORKSPACES_EXPERIMENTAL_FEATURES,
      AppRoutes.spaces.settingsGeneral,
    )
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
