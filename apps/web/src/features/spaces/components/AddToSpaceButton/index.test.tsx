import { render } from '@/tests/test-utils'
import AddToSpaceButton from './index'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as spacesExports from '@/features/spaces'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/features/spaces', () => ({
  ...jest.requireActual('@/features/spaces'),
  useIsQualifiedSafe: jest.fn(),
}))
jest.mock('next/router', () => ({
  useRouter: () => ({ query: { safe: 'eth:0x1234' } }),
}))

// Mock CheckWallet to pass through with ok=true by default
const mockCheckWalletOk = jest.fn().mockReturnValue(true)
jest.mock('@/components/common/CheckWallet', () => {
  return ({ children }: { children: (ok: boolean) => React.ReactElement }) => children(mockCheckWalletOk())
})

describe('AddToSpaceButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckWalletOk.mockReturnValue(true)
  })

  const setupMocks = ({
    deployed = true,
    isQualifiedSafe = false,
  }: {
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
    ;(spacesExports.useIsQualifiedSafe as jest.Mock).mockReturnValue(isQualifiedSafe)
  }

  it('renders when safe is deployed and not in a space', () => {
    setupMocks()

    const { getByTestId } = render(<AddToSpaceButton />)

    expect(getByTestId('add-to-space-btn')).toBeInTheDocument()
    expect(getByTestId('add-to-space-btn')).toHaveTextContent('Add to Space')
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

  it('is disabled when wallet is not connected', () => {
    setupMocks()
    mockCheckWalletOk.mockReturnValue(false)

    const { getByTestId } = render(<AddToSpaceButton />)

    expect(getByTestId('add-to-space-btn')).toBeDisabled()
  })

  it('links to the Spaces welcome page', () => {
    setupMocks()

    const { getByTestId } = render(<AddToSpaceButton />)

    const link = getByTestId('add-to-space-btn').closest('a')
    expect(link).toHaveAttribute('href', '/welcome/spaces?safe=eth%3A0x1234')
  })
})
