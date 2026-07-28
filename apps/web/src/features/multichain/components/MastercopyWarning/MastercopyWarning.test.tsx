import type { ReactNode } from 'react'
import { screen } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import { MastercopyWarning } from './MastercopyWarning'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import type { MastercopyMigration } from '../../hooks/useMastercopyMigration'

const CHANGELOG = 'https://github.com/gnosis/safe-contracts/releases'

jest.mock('../../hooks/useMastercopyMigration')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/components/tx-flow/flows', () => ({
  MigrateSafeL2Flow: () => null,
  UpdateSafeFlow: () => null,
}))
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactNode }) => <>{children(true)}</>,
}))

const mockUseMastercopyMigration = jest.requireMock('../../hooks/useMastercopyMigration')
  .useMastercopyMigration as jest.Mock
const mockUseIsSafeOwner = jest.requireMock('@/hooks/useIsSafeOwner').default as jest.Mock

const migration = (overrides: Partial<MastercopyMigration> = {}): MastercopyMigration => ({
  state: ImplementationVersionState.UP_TO_DATE,
  action: 'none',
  isCritical: false,
  isOfficialDeployer: false,
  isSupportedVersion: true,
  latestVersion: '1.4.1',
  changelogUrl: CHANGELOG,
  isBytecodeLoading: false,
  ...overrides,
})

describe('MastercopyWarning', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsSafeOwner.mockReturnValue(true)
  })

  describe('unsupported mastercopy (identical for both variants)', () => {
    it("renders the Migrate ActionCard for the 'migrate' action", () => {
      mockUseMastercopyMigration.mockReturnValue(
        migration({ state: ImplementationVersionState.UNKNOWN, action: 'migrate' }),
      )

      render(<MastercopyWarning variant="settings" />)

      expect(screen.getByTestId('action-card')).toBeInTheDocument()
      expect(screen.getByText(/This Safe is running an unsupported version/)).toBeInTheDocument()
      expect(screen.getByText(/You should migrate it to a compatible version/)).toBeInTheDocument()
      expect(screen.getByTestId('migrate-mastercopy-btn')).toBeInTheDocument()
      expect(screen.getByText('Migrate')).toBeInTheDocument()
    })

    it("renders the Get CLI ActionCard for the 'cli' action", () => {
      mockUseMastercopyMigration.mockReturnValue(
        migration({ state: ImplementationVersionState.UNKNOWN, action: 'cli' }),
      )

      render(<MastercopyWarning />)

      expect(screen.getByTestId('action-card')).toBeInTheDocument()
      expect(screen.getByText(/You must use our CLI tool to migrate/)).toBeInTheDocument()
      const link = screen.getByTestId('get-cli-link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://github.com/5afe/safe-cli')
    })
  })

  describe('dashboard variant update', () => {
    it('renders the info ActionCard with an Update button for a critical official update', () => {
      mockUseMastercopyMigration.mockReturnValue(
        migration({
          state: ImplementationVersionState.OUTDATED,
          action: 'update',
          isCritical: true,
          isOfficialDeployer: true,
        }),
      )

      render(<MastercopyWarning />)

      expect(screen.getByTestId('action-card')).toBeInTheDocument()
      expect(screen.getByText(/New Safe version is available - 1.4.1/)).toBeInTheDocument()
      expect(screen.getByTestId('update-mastercopy-btn')).toBeInTheDocument()
      expect(screen.getByText('Update')).toBeInTheDocument()
    })

    it('omits the Update button for non-owners', () => {
      mockUseIsSafeOwner.mockReturnValue(false)
      mockUseMastercopyMigration.mockReturnValue(
        migration({
          state: ImplementationVersionState.OUTDATED,
          action: 'update',
          isCritical: true,
          isOfficialDeployer: true,
        }),
      )

      render(<MastercopyWarning />)

      expect(screen.getByTestId('action-card')).toBeInTheDocument()
      expect(screen.queryByText('Update')).not.toBeInTheDocument()
    })

    it('renders nothing for a non-critical update', () => {
      mockUseMastercopyMigration.mockReturnValue(
        migration({
          state: ImplementationVersionState.OUTDATED,
          action: 'update',
          isCritical: false,
          isOfficialDeployer: true,
        }),
      )

      const { container } = render(<MastercopyWarning />)
      expect(container.firstChild).toBeNull()
    })

    it('renders nothing for a critical but non-official update', () => {
      mockUseMastercopyMigration.mockReturnValue(
        migration({
          state: ImplementationVersionState.OUTDATED,
          action: 'update',
          isCritical: true,
          isOfficialDeployer: false,
        }),
      )

      const { container } = render(<MastercopyWarning />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('settings variant update', () => {
    it('renders the Alert (changelog + owner-gated Update) for a critical official update', () => {
      mockUseMastercopyMigration.mockReturnValue(
        migration({
          state: ImplementationVersionState.OUTDATED,
          action: 'update',
          isCritical: true,
          isOfficialDeployer: true,
        }),
      )

      render(<MastercopyWarning variant="settings" />)

      expect(screen.getByText(/New version is available: 1.4.1/)).toBeInTheDocument()
      expect(screen.getByText('changelog').closest('a')).toHaveAttribute('href', CHANGELOG)
      expect(screen.getByText('Update')).toBeInTheDocument()
      // Settings Update button intentionally has no tracking test id.
      expect(screen.queryByTestId('update-mastercopy-btn')).not.toBeInTheDocument()
    })

    it('still renders the update Alert for a NON-critical official update', () => {
      mockUseMastercopyMigration.mockReturnValue(
        migration({
          state: ImplementationVersionState.OUTDATED,
          action: 'update',
          isCritical: false,
          isOfficialDeployer: true,
        }),
      )

      render(<MastercopyWarning variant="settings" />)

      expect(screen.getByText(/New version is available: 1.4.1/)).toBeInTheDocument()
      expect(screen.getByText('Update')).toBeInTheDocument()
    })

    it('renders nothing for a non-official update', () => {
      mockUseMastercopyMigration.mockReturnValue(
        migration({ state: ImplementationVersionState.OUTDATED, action: 'update', isOfficialDeployer: false }),
      )

      const { container } = render(<MastercopyWarning variant="settings" />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('common', () => {
    it("renders nothing for the 'none' action (both variants)", () => {
      mockUseMastercopyMigration.mockReturnValue(migration({ action: 'none' }))

      const dashboard = render(<MastercopyWarning />)
      expect(dashboard.container.firstChild).toBeNull()

      const settings = render(<MastercopyWarning variant="settings" />)
      expect(settings.container.firstChild).toBeNull()
    })

    it('renders nothing while the bytecode comparison is loading', () => {
      mockUseMastercopyMigration.mockReturnValue(
        migration({ state: ImplementationVersionState.UNKNOWN, action: 'migrate', isBytecodeLoading: true }),
      )

      const { container } = render(<MastercopyWarning variant="settings" />)
      expect(container.firstChild).toBeNull()
    })
  })
})
