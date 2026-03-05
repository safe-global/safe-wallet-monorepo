import { screen } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import { OutdatedMastercopyWarning } from './OutdatedMastercopyWarning'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import { MasterCopyDeployer } from '@/hooks/useMasterCopies'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useMasterCopies', () => ({
  ...jest.requireActual('@/hooks/useMasterCopies'),
  useMasterCopies: jest.fn(),
}))
jest.mock('@/hooks/useChains')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/components/tx-flow/flows', () => ({
  UpdateSafeFlow: () => null,
}))

const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock
const mockUseMasterCopies = jest.requireMock('@/hooks/useMasterCopies').useMasterCopies as jest.Mock
const mockUseCurrentChain = jest.requireMock('@/hooks/useChains').useCurrentChain as jest.Mock
const mockUseIsSafeOwner = jest.requireMock('@/hooks/useIsSafeOwner').default as jest.Mock

const MOCK_ADDRESS = '0x3E5c63644E683549055b9Be8653de26E0B4CD36E'

const gnosisMasterCopy = {
  address: MOCK_ADDRESS,
  version: '1.1.1',
  deployer: MasterCopyDeployer.GNOSIS,
  deployerRepoUrl: 'https://github.com/gnosis/safe-contracts/releases',
}

const defaultSafe = {
  implementation: { value: MOCK_ADDRESS },
  implementationVersionState: ImplementationVersionState.OUTDATED,
  version: '1.1.1',
}

describe('OutdatedMastercopyWarning', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeInfo.mockReturnValue({ safe: defaultSafe })
    mockUseMasterCopies.mockReturnValue([[gnosisMasterCopy], undefined, false])
    mockUseCurrentChain.mockReturnValue({ recommendedMasterCopyVersion: '1.4.1' })
    mockUseIsSafeOwner.mockReturnValue(true)
  })

  it('returns null when UP_TO_DATE', () => {
    mockUseSafeInfo.mockReturnValue({
      safe: { ...defaultSafe, implementationVersionState: ImplementationVersionState.UP_TO_DATE },
    })

    const { container } = render(<OutdatedMastercopyWarning />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when OUTDATED but version is non-critical (>= 1.3.0)', () => {
    mockUseSafeInfo.mockReturnValue({
      safe: { ...defaultSafe, version: '1.3.0', implementationVersionState: ImplementationVersionState.OUTDATED },
    })
    mockUseMasterCopies.mockReturnValue([[{ ...gnosisMasterCopy, version: '1.3.0' }], undefined, false])

    const { container } = render(<OutdatedMastercopyWarning />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when OUTDATED and critical but deployer is not GNOSIS', () => {
    mockUseMasterCopies.mockReturnValue([
      [{ ...gnosisMasterCopy, deployer: MasterCopyDeployer.CIRCLES }],
      undefined,
      false,
    ])

    const { container } = render(<OutdatedMastercopyWarning />)
    expect(container.firstChild).toBeNull()
  })

  it('renders ActionCard with info severity and correct copy when all conditions met', () => {
    render(<OutdatedMastercopyWarning />)

    expect(screen.getByTestId('action-card')).toBeInTheDocument()
    expect(screen.getByText(/New Safe version is available/)).toBeInTheDocument()
    expect(screen.getByText(/Update now to take advantage of new features/)).toBeInTheDocument()
  })

  it('renders Update CTA for owners', () => {
    render(<OutdatedMastercopyWarning />)

    expect(screen.getByText('Update')).toBeInTheDocument()
  })

  it('omits Update CTA for non-owners', () => {
    mockUseIsSafeOwner.mockReturnValue(false)

    render(<OutdatedMastercopyWarning />)

    expect(screen.queryByText('Update')).not.toBeInTheDocument()
    expect(screen.getByTestId('action-card')).toBeInTheDocument()
  })
})
