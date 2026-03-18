import { render } from '@/tests/test-utils'
import AddToSpaceButton from './index'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useChains from '@/hooks/useChains'
import * as spacesExports from '@/features/spaces'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChains')
jest.mock('@/features/spaces', () => ({
  ...jest.requireActual('@/features/spaces'),
  useIsQualifiedSafe: jest.fn(),
}))
jest.mock('next/router', () => ({
  useRouter: () => ({ query: { safe: 'eth:0x1234' } }),
}))

describe('AddToSpaceButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const setupMocks = ({
    spacesEnabled = true,
    deployed = true,
    isQualifiedSafe = false,
  }: {
    spacesEnabled?: boolean
    deployed?: boolean
    isQualifiedSafe?: boolean
  } = {}) => {
    const mockSafe = extendedSafeInfoBuilder().build()
    mockSafe.deployed = deployed

    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(spacesEnabled)
    ;(spacesExports.useIsQualifiedSafe as jest.Mock).mockReturnValue(isQualifiedSafe)
  }

  it('renders when Spaces is enabled, safe is deployed, and safe is not in a space', () => {
    setupMocks()

    const { getByTestId } = render(<AddToSpaceButton />)

    expect(getByTestId('add-to-space-btn')).toBeInTheDocument()
    expect(getByTestId('add-to-space-btn')).toHaveTextContent('Add to Space')
  })

  it('does not render when Spaces feature is disabled', () => {
    setupMocks({ spacesEnabled: false })

    const { queryByTestId } = render(<AddToSpaceButton />)

    expect(queryByTestId('add-to-space-btn')).not.toBeInTheDocument()
  })

  it('does not render when safe is not deployed', () => {
    setupMocks({ deployed: false })

    const { queryByTestId } = render(<AddToSpaceButton />)

    expect(queryByTestId('add-to-space-btn')).not.toBeInTheDocument()
  })

  it('does not render when safe is already in a space', () => {
    setupMocks({ isQualifiedSafe: true })

    const { queryByTestId } = render(<AddToSpaceButton />)

    expect(queryByTestId('add-to-space-btn')).not.toBeInTheDocument()
  })

  it('links to the Spaces welcome page', () => {
    setupMocks()

    const { getByTestId } = render(<AddToSpaceButton />)

    const link = getByTestId('add-to-space-btn').closest('a')
    expect(link).toHaveAttribute('href', '/welcome/spaces?safe=eth%3A0x1234')
  })
})
