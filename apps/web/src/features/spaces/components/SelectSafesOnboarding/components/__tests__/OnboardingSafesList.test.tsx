import type { SafeItem } from '@/hooks/safes'
import { render } from '@/tests/test-utils'

import OnboardingSafesList from '../OnboardingSafesList'

// Stub the (MUI) accounts table so these tests stay focused on section/flag wiring.
// The barrel is replaced wholesale (not spread) to avoid a circular-init crash when required.
jest.mock('@/features/myAccounts', () => ({
  __esModule: true,
  SafeAccountsTable: ({
    items,
    similarWarnings,
    similarityGroups,
    selection,
    'data-testid': testId,
  }: {
    items: Array<{ address: string }>
    similarWarnings?: Map<string, unknown>
    similarityGroups?: Map<string, string>
    selection?: { isAtLimit?: boolean }
    'data-testid'?: string
  }) => (
    <div
      data-testid={testId}
      data-warnings={[...(similarWarnings ?? new Map())].map(([address]) => address).join(',')}
      data-groups={[...(similarityGroups ?? new Map())].map(([address, group]) => `${address}:${group}`).join(',')}
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
  flaggedAddresses: new Set<string>(),
  trustedSimilarityGroups: new Map<string, string>(),
  ownedSimilarityGroups: new Map<string, string>(),
  similarWarnings: new Map<string, { trusted: string[]; owned: string[] }>(),
  selectedKeys: new Set<string>(),
  onToggle: noop,
  isAtLimit: false,
}

describe('OnboardingSafesList', () => {
  it('renders no sections when both lists are empty', () => {
    const { queryByText, queryByTestId } = render(
      <OnboardingSafesList trustedSafes={[]} ownedSafes={[]} {...baseProps} />,
    )

    expect(queryByText('My accounts')).not.toBeInTheDocument()
    expect(queryByText('Owned safe accounts')).not.toBeInTheDocument()
    expect(queryByTestId('onboarding-trusted-table')).not.toBeInTheDocument()
    expect(queryByTestId('onboarding-owned-table')).not.toBeInTheDocument()
  })

  it('renders the trusted section with its table', () => {
    const { getByText, getByTestId } = render(
      <OnboardingSafesList trustedSafes={[buildSafeItem('0xTrusted')]} ownedSafes={[]} {...baseProps} />,
    )

    expect(getByText('My accounts')).toBeInTheDocument()
    expect(getByTestId('onboarding-trusted-table')).toHaveTextContent('0xTrusted')
  })

  it('renders the owned section with its table', () => {
    const { getByText, getByTestId } = render(
      <OnboardingSafesList trustedSafes={[]} ownedSafes={[buildSafeItem('0xOwned')]} {...baseProps} />,
    )

    expect(getByText('Owned safe accounts')).toBeInTheDocument()
    expect(getByTestId('onboarding-owned-table')).toHaveTextContent('0xOwned')
  })

  it('passes the cross-list warnings to both the trusted and owned tables', () => {
    const warnings = new Map([
      ['0xtrusted', { trusted: [], owned: ['0xowned'] }],
      ['0xowned', { trusted: ['0xtrusted'], owned: [] }],
    ])
    const { getByTestId } = render(
      <OnboardingSafesList
        trustedSafes={[buildSafeItem('0xTrusted')]}
        ownedSafes={[buildSafeItem('0xOwned')]}
        {...baseProps}
        similarWarnings={warnings}
      />,
    )

    expect(getByTestId('onboarding-trusted-table').dataset.warnings).toBe('0xtrusted,0xowned')
    expect(getByTestId('onboarding-owned-table').dataset.warnings).toBe('0xtrusted,0xowned')
  })

  it('shows a single security banner above the sections when any row is flagged', () => {
    const { queryByTestId, queryAllByTestId, rerender } = render(
      <OnboardingSafesList
        trustedSafes={[buildSafeItem('0xTrusted')]}
        ownedSafes={[buildSafeItem('0xOwned')]}
        {...baseProps}
      />,
    )
    expect(queryByTestId('security-banner')).not.toBeInTheDocument()

    // Flagging only a trusted row must surface the banner too (WA-2912).
    rerender(
      <OnboardingSafesList
        trustedSafes={[buildSafeItem('0xTrusted')]}
        ownedSafes={[buildSafeItem('0xOwned')]}
        {...baseProps}
        flaggedAddresses={new Set(['0xtrusted'])}
      />,
    )
    expect(queryAllByTestId('security-banner')).toHaveLength(1)
    // Rendered above both section tables
    const banner = queryByTestId('security-banner')
    const trustedTable = queryByTestId('onboarding-trusted-table')
    expect(banner && trustedTable && banner.compareDocumentPosition(trustedTable)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('routes each list its own similarity groups', () => {
    const { getByTestId } = render(
      <OnboardingSafesList
        trustedSafes={[buildSafeItem('0xTrusted')]}
        ownedSafes={[buildSafeItem('0xOwned')]}
        {...baseProps}
        trustedSimilarityGroups={new Map([['0xtrusted', 'g1']])}
        ownedSimilarityGroups={new Map([['0xowned', 'g2']])}
      />,
    )

    expect(getByTestId('onboarding-trusted-table').dataset.groups).toBe('0xtrusted:g1')
    expect(getByTestId('onboarding-owned-table').dataset.groups).toBe('0xowned:g2')
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
