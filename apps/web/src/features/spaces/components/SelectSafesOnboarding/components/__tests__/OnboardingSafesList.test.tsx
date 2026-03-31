import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'
import { render } from '@/tests/test-utils'

import OnboardingSafesList from '../OnboardingSafesList'

// Mock child components to keep tests focused on list rendering logic
jest.mock('@/components/common/SafeList/components', () => ({
  SafeCard: ({ safe, isSimilar }: { safe: SafeItem | MultiChainSafeItem; isSimilar?: boolean }) => (
    <div data-testid={`safe-card-${safe.address}`} data-similar={isSimilar}>
      {safe.address}
    </div>
  ),
  SimilarAddressAlert: () => <div data-testid="similar-address-alert">Similar addresses detected</div>,
}))

const buildSafeItem = (address: string, chainId = '1'): SafeItem =>
  ({
    address,
    chainId,
    isPinned: false,
    isReadOnly: false,
    lastVisited: 0,
    name: undefined,
  }) as SafeItem

describe('OnboardingSafesList', () => {
  it('renders nothing when both lists are empty', () => {
    const { queryByText } = render(
      <OnboardingSafesList trustedSafes={[]} ownedSafes={[]} similarAddresses={new Set()} />,
    )

    expect(queryByText('Trusted safes')).not.toBeInTheDocument()
    expect(queryByText('Owned safes')).not.toBeInTheDocument()
  })

  it('renders trusted safes section when trustedSafes is non-empty', () => {
    const trusted = [buildSafeItem('0xTrusted')]

    const { getByText, getByTestId } = render(
      <OnboardingSafesList trustedSafes={trusted} ownedSafes={[]} similarAddresses={new Set()} />,
    )

    expect(getByText('Trusted safes')).toBeInTheDocument()
    expect(getByTestId('safe-card-0xTrusted')).toBeInTheDocument()
  })

  it('renders owned safes section when ownedSafes is non-empty', () => {
    const owned = [buildSafeItem('0xOwned')]

    const { getByText, getByTestId } = render(
      <OnboardingSafesList trustedSafes={[]} ownedSafes={owned} similarAddresses={new Set()} />,
    )

    expect(getByText('Owned safes')).toBeInTheDocument()
    expect(getByTestId('safe-card-0xOwned')).toBeInTheDocument()
  })

  it('renders both sections when both lists have safes', () => {
    const trusted = [buildSafeItem('0xTrusted')]
    const owned = [buildSafeItem('0xOwned')]

    const { getByText } = render(
      <OnboardingSafesList trustedSafes={trusted} ownedSafes={owned} similarAddresses={new Set()} />,
    )

    expect(getByText('Trusted safes')).toBeInTheDocument()
    expect(getByText('Owned safes')).toBeInTheDocument()
  })

  it('shows similar address alert when similarAddresses is non-empty', () => {
    const { getByTestId } = render(
      <OnboardingSafesList trustedSafes={[]} ownedSafes={[]} similarAddresses={new Set(['0xflagged'])} />,
    )

    expect(getByTestId('similar-address-alert')).toBeInTheDocument()
  })

  it('does not show similar address alert when similarAddresses is empty', () => {
    const { queryByTestId } = render(
      <OnboardingSafesList trustedSafes={[]} ownedSafes={[]} similarAddresses={new Set()} />,
    )

    expect(queryByTestId('similar-address-alert')).not.toBeInTheDocument()
  })

  it('passes isSimilar=true to SafeCard for flagged addresses', () => {
    const trusted = [buildSafeItem('0xflagged')]
    const owned = [buildSafeItem('0xnormal')]
    const similar = new Set(['0xflagged'])

    const { getByTestId } = render(
      <OnboardingSafesList trustedSafes={trusted} ownedSafes={owned} similarAddresses={similar} />,
    )

    expect(getByTestId('safe-card-0xflagged').dataset.similar).toBe('true')
    expect(getByTestId('safe-card-0xnormal').dataset.similar).toBe('false')
  })
})
