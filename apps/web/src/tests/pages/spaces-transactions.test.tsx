import { render, screen } from '@testing-library/react'
import SpaceTransactionsPage from '../../pages/spaces/transactions'
import { AppRoutes } from '@/config/routes'
import * as router from 'next/router'
import * as spacesFeatureUseCurrentSpaceId from '@/features/spaces/public/useCurrentSpaceId'
import * as spacesFeatureUseFeatureRedirect from '@/features/spaces/public/useFeatureRedirect'
import { FEATURES } from '@safe-global/utils/utils/chains'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/features/spaces/public/SpaceTransactionsPage', () => ({
  __esModule: true,
  default: ({ spaceId }: { spaceId: string }) => <div data-testid="space-transactions">transactions {spaceId}</div>,
}))
jest.mock('@/features/spaces/public/useCurrentSpaceId', () => ({
  useCurrentSpaceId: jest.fn(),
}))
jest.mock('@/features/spaces/public/useFeatureRedirect', () => ({
  ...jest.requireActual('@/features/spaces/public/useFeatureRedirect'),
  __esModule: true,
  default: jest.fn(),
}))

const SPACE_ID = 'space-uuid-1'

const setup = ({ isReady = true, spaceId = SPACE_ID }: { isReady?: boolean; spaceId?: string } = {}) => {
  ;(router.useRouter as jest.Mock).mockReturnValue({ isReady, query: spaceId ? { spaceId } : {} })
  ;(spacesFeatureUseCurrentSpaceId.useCurrentSpaceId as jest.Mock).mockReturnValue(spaceId || null)
}

describe('SpaceTransactionsPage (/spaces/transactions)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to the spaces index when the SPACE_TRANSACTIONS flag is off', () => {
    setup()

    render(<SpaceTransactionsPage />)

    expect(spacesFeatureUseFeatureRedirect.default).toHaveBeenCalledWith(
      FEATURES.SPACE_TRANSACTIONS,
      AppRoutes.spaces.index,
    )
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
