import type { ReactNode } from 'react'
import { screen } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import { ContractVersion } from './index'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import type { MastercopyMigration } from '@/features/multichain'

const GNOSIS_REPO = 'https://github.com/gnosis/safe-contracts/releases'

// `@/components/common/Mui` re-exports `@mui/material/index` (ESM), which Jest does not
// transform; ContractVersion only needs `Box` from it, so stub it out.
jest.mock('@/components/common/Mui', () => ({
  __esModule: true,
  Box: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))
jest.mock('@/hooks/useSafeInfo')
// Stub MastercopyWarning capturing its `variant` prop. ContractVersion owns only the
// version chrome and the delegation; the settings Alert / cards it renders are asserted
// end-to-end in MastercopyWarning.test.tsx.
jest.mock('@/features/multichain', () => ({
  __esModule: true,
  useMastercopyMigration: jest.fn(),
  MastercopyWarning: ({ variant }: { variant?: string }) => (
    <div data-testid="mock-mastercopy-warning" data-variant={variant ?? 'dashboard'} />
  ),
}))

const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock
const mockUseMastercopyMigration = jest.requireMock('@/features/multichain').useMastercopyMigration as jest.Mock

const migration = (overrides: Partial<MastercopyMigration> = {}): MastercopyMigration => ({
  state: ImplementationVersionState.UP_TO_DATE,
  action: 'none',
  isCritical: false,
  isOfficialDeployer: false,
  isSupportedVersion: true,
  latestVersion: '1.4.1',
  changelogUrl: GNOSIS_REPO,
  isBytecodeLoading: false,
  ...overrides,
})

const setSafe = (version: string | null, state = ImplementationVersionState.UP_TO_DATE) => {
  mockUseSafeInfo.mockReturnValue({
    safe: { version, implementationVersionState: state, implementation: { value: '0x1' }, deployed: true },
    safeAddress: '0x1',
    safeLoaded: true,
  })
}

const expectSettingsDelegation = () => {
  expect(screen.getByTestId('mock-mastercopy-warning')).toHaveAttribute('data-variant', 'settings')
}

describe('ContractVersion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the "Latest version" check and delegates the (empty) warning area when up to date', () => {
    setSafe('1.4.1')
    mockUseMastercopyMigration.mockReturnValue(migration({ action: 'none', isOfficialDeployer: true }))

    render(<ContractVersion />)

    expect(screen.getByText(/Latest version/)).toBeInTheDocument()
    expectSettingsDelegation()
  })

  it('hides the check and delegates the settings update card for an outdated official Safe', () => {
    setSafe('1.3.0', ImplementationVersionState.OUTDATED)
    mockUseMastercopyMigration.mockReturnValue(
      migration({ action: 'update', isCritical: true, isOfficialDeployer: true }),
    )

    render(<ContractVersion />)

    expect(screen.queryByText(/Latest version/)).not.toBeInTheDocument()
    expectSettingsDelegation()
  })

  it('delegates the settings update card even for a NON-critical outdated official Safe', () => {
    setSafe('1.3.0', ImplementationVersionState.OUTDATED)
    mockUseMastercopyMigration.mockReturnValue(
      migration({ action: 'update', isCritical: false, isOfficialDeployer: true }),
    )

    render(<ContractVersion />)

    // No `isCritical` gate for the check either: an outdated official Safe never shows it.
    expect(screen.queryByText(/Latest version/)).not.toBeInTheDocument()
    expectSettingsDelegation()
  })

  it('keeps the version check for an UNKNOWN Safe with a reported version and delegates the warning', () => {
    setSafe('1.3.0', ImplementationVersionState.UNKNOWN)
    mockUseMastercopyMigration.mockReturnValue(migration({ action: 'migrate', isOfficialDeployer: false }))

    render(<ContractVersion />)

    // Preserves today's behaviour: an unsupported Safe that still reports a version keeps the check.
    expect(screen.getByText(/Latest version/)).toBeInTheDocument()
    expectSettingsDelegation()
  })

  it('shows the version check for an outdated non-official Safe (no update card)', () => {
    setSafe('1.3.0', ImplementationVersionState.OUTDATED)
    mockUseMastercopyMigration.mockReturnValue(migration({ action: 'update', isOfficialDeployer: false }))

    render(<ContractVersion />)

    expect(screen.getByText(/Latest version/)).toBeInTheDocument()
    expectSettingsDelegation()
  })

  it('renders the "View release" link for a reported version', () => {
    setSafe('1.4.1')
    mockUseMastercopyMigration.mockReturnValue(migration({ action: 'none', isOfficialDeployer: true }))

    render(<ContractVersion />)

    expect(screen.getByText('View release').closest('a')).toHaveAttribute(
      'href',
      'https://github.com/safe-fndn/safe-smart-account/releases/tag/v1.4.1',
    )
  })
})
