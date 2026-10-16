import { render, screen } from '@testing-library/react'
import SpaceTransactionsPage from '../../pages/spaces/transactions'
import { AppRoutes } from '@/config/routes'
import * as router from 'next/router'
import * as featureModule from '@/features/__core__'
import * as spacesFeature from '@/features/spaces'
import { FEATURES } from '@safe-global/utils/utils/chains'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: jest.fn(),
}))

jest.mock('@/features/spaces', () => ({
  SpacesFeature: 'SpacesFeature',
  useFeatureFlagRedirect: jest.fn(),
  useFeatureRedirect: jest.fn(),
}))

const SPACE_ID = 'space-uuid-1'

const SpaceTransactionsPageMock = ({ spaceId }: { spaceId: string }) => (
  <div data-testid="space-transactions">transactions {spaceId}</div>
)

const setup = ({ isReady = true, spaceId = SPACE_ID }: { isReady?: boolean; spaceId?: string } = {}) => {
  ;(router.useRouter as jest.Mock).mockReturnValue({ isReady, query: spaceId ? { spaceId } : {} })
  ;(featureModule.useLoadFeature as jest.Mock).mockReturnValue({ SpaceTransactionsPage: SpaceTransactionsPageMock })
}

describe('SpaceTransactionsPage (/spaces/transactions)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to the spaces index when the SPACE_TRANSACTIONS flag is off', () => {
    setup()

    render(<SpaceTransactionsPage />)

    expect(spacesFeature.useFeatureFlagRedirect).toHaveBeenCalled()
    expect(spacesFeature.useFeatureRedirect).toHaveBeenCalledWith(FEATURES.SPACE_TRANSACTIONS, AppRoutes.spaces.index)
  })

  it('renders the space transactions page for the spaceId in the URL', () => {
    setup()

    render(<SpaceTransactionsPage />)

    expect(screen.getByTestId('space-transactions')).toHaveTextContent(`transactions ${SPACE_ID}`)
  })

  it('renders nothing until the router has the spaceId', () => {
    setup({ spaceId: '' })

    const { container } = render(<SpaceTransactionsPage />)

    expect(container).toBeEmptyDOMElement()
  })
})
