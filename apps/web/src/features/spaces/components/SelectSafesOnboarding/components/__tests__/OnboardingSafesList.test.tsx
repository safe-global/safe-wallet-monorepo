import type { SafeItem } from '@/hooks/safes'
import { render } from '@/tests/test-utils'

import OnboardingSafesList from '../OnboardingSafesList'

// Stub the (MUI) accounts table so these tests stay focused on section/flag wiring.
// The barrel is replaced wholesale (not spread) to avoid a circular-init crash when required.
jest.mock('@/features/myAccounts', () => ({
  __esModule: true,
  SafeAccountsTable: ({
    items,
    flaggedAddresses,
    selection,
    'data-testid': testId,
  }: {
    items: Array<{ address: string }>
    flaggedAddresses?: Set<string>
    selection?: { isAtLimit?: boolean }
    'data-testid'?: string
  }) => (
    <div
      data-testid={testId}
      data-flagged={[...(flaggedAddresses ?? [])].join(',')}
      data-at-limit={String(Boolean(selection?.isAtLimit))}
    >
      {items.map((item) => (
        <span key={item.address}>{item.address}</span>
      ))}
    </div>
  ),
}))

jest.mock('@/components/common/TrustedSafesModal/SecurityBanner', () => ({
  __esModule: true,
  default: () => <div data-testid="security-banner">Verify before you trust</div>,
}))

const buildSafeItem = (address: string, chainId = '1'): SafeItem =>
  ({ address, chainId, isPinned: false, isReadOnly: false, lastVisited: 0, name: undefined }) as SafeItem

const noop = () => {}

const baseProps = {
  flaggedOwnedAddresses: new Set<string>(),
  selectedKeys: new Set<string>(),
  onToggle: noop,
  isAtLimit: false,
}

describe('OnboardingSafesList', () => {
  it('renders no sections when both lists are empty', () => {
    const { queryByText, queryByTestId } = render(
      <OnboardingSafesList trustedSafes={[]} ownedSafes={[]} {...baseProps} />,
    )

    expect(queryByText('Trusted safe accounts')).not.toBeInTheDocument()
    expect(queryByText('Owned safe accounts')).not.toBeInTheDocument()
    expect(queryByTestId('onboarding-trusted-table')).not.toBeInTheDocument()
    expect(queryByTestId('onboarding-owned-table')).not.toBeInTheDocument()
  })

  it('renders the trusted section with its table', () => {
    const { getByText, getByTestId } = render(
      <OnboardingSafesList trustedSafes={[buildSafeItem('0xTrusted')]} ownedSafes={[]} {...baseProps} />,
    )

    expect(getByText('Trusted safe accounts')).toBeInTheDocument()
    expect(getByTestId('onboarding-trusted-table')).toHaveTextContent('0xTrusted')
  })

  it('renders the owned section with its table', () => {
    const { getByText, getByTestId } = render(
      <OnboardingSafesList trustedSafes={[]} ownedSafes={[buildSafeItem('0xOwned')]} {...baseProps} />,
    )

    expect(getByText('Owned safe accounts')).toBeInTheDocument()
    expect(getByTestId('onboarding-owned-table')).toHaveTextContent('0xOwned')
  })

  it('flags only the owned table, never the trusted table', () => {
    const { getByTestId } = render(
      <OnboardingSafesList
        trustedSafes={[buildSafeItem('0xTrusted')]}
        ownedSafes={[buildSafeItem('0xOwned')]}
        {...baseProps}
        flaggedOwnedAddresses={new Set(['0xowned'])}
      />,
    )

    expect(getByTestId('onboarding-trusted-table').dataset.flagged).toBe('')
    expect(getByTestId('onboarding-owned-table').dataset.flagged).toBe('0xowned')
  })

  it('shows the security banner only when an owned safe is flagged', () => {
    const { queryByTestId, rerender } = render(
      <OnboardingSafesList trustedSafes={[]} ownedSafes={[buildSafeItem('0xOwned')]} {...baseProps} />,
    )
    expect(queryByTestId('security-banner')).not.toBeInTheDocument()

    rerender(
      <OnboardingSafesList
        trustedSafes={[]}
        ownedSafes={[buildSafeItem('0xOwned')]}
        {...baseProps}
        flaggedOwnedAddresses={new Set(['0xowned'])}
      />,
    )
    expect(queryByTestId('security-banner')).toBeInTheDocument()
  })

  it('passes isAtLimit down to both tables', () => {
    const { getByTestId } = render(
      <OnboardingSafesList
        trustedSafes={[buildSafeItem('0xTrusted')]}
        ownedSafes={[buildSafeItem('0xOwned')]}
        {...baseProps}
        isAtLimit
      />,
    )

    expect(getByTestId('onboarding-trusted-table').dataset.atLimit).toBe('true')
    expect(getByTestId('onboarding-owned-table').dataset.atLimit).toBe('true')
  })
})
