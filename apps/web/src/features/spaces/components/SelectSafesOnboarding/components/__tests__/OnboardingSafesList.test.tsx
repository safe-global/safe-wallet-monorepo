import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import { INTRA_LIST_MATCH, type SelectionSimilarity } from '@/features/address-poisoning'
import { render } from '@/tests/test-utils'

import OnboardingSafesList from '../OnboardingSafesList'

// Mock child components to keep tests focused on list rendering logic
jest.mock('../SafeCard', () => ({
  __esModule: true,
  default: ({
    safe,
    match,
    isAtLimit,
  }: {
    safe: SafeItem | MultiChainSafeItem
    match?: SimilarityMatch
    intraList?: boolean
    isAtLimit?: boolean
  }) => (
    <div data-testid={`safe-card-${safe.address}`} data-similar={!!match} data-at-limit={isAtLimit}>
      {safe.address}
    </div>
  ),
}))

const noSimilarities: Map<string, SelectionSimilarity> = new Map()

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
      <OnboardingSafesList trustedSafes={[]} ownedSafes={[]} similarities={noSimilarities} />,
    )

    expect(queryByText('Trusted safes')).not.toBeInTheDocument()
    expect(queryByText('Owned safes')).not.toBeInTheDocument()
  })

  it('renders trusted safes section when trustedSafes is non-empty', () => {
    const trusted = [buildSafeItem('0xTrusted')]

    const { getByText, getByTestId } = render(
      <OnboardingSafesList trustedSafes={trusted} ownedSafes={[]} similarities={noSimilarities} />,
    )

    expect(getByText('Trusted safes')).toBeInTheDocument()
    expect(getByTestId('safe-card-0xTrusted')).toBeInTheDocument()
  })

  it('renders owned safes section when ownedSafes is non-empty', () => {
    const owned = [buildSafeItem('0xOwned')]

    const { getByText, getByTestId } = render(
      <OnboardingSafesList trustedSafes={[]} ownedSafes={owned} similarities={noSimilarities} />,
    )

    expect(getByText('Owned safes')).toBeInTheDocument()
    expect(getByTestId('safe-card-0xOwned')).toBeInTheDocument()
  })

  it('renders both sections when both lists have safes', () => {
    const trusted = [buildSafeItem('0xTrusted')]
    const owned = [buildSafeItem('0xOwned')]

    const { getByText } = render(
      <OnboardingSafesList trustedSafes={trusted} ownedSafes={owned} similarities={noSimilarities} />,
    )

    expect(getByText('Trusted safes')).toBeInTheDocument()
    expect(getByText('Owned safes')).toBeInTheDocument()
  })

  it('passes isAtLimit down to safe cards in both sections', () => {
    const trusted = [buildSafeItem('0xTrusted')]
    const owned = [buildSafeItem('0xOwned')]

    const { getByTestId } = render(
      <OnboardingSafesList trustedSafes={trusted} ownedSafes={owned} similarities={noSimilarities} isAtLimit />,
    )

    expect(getByTestId('safe-card-0xTrusted').dataset.atLimit).toBe('true')
    expect(getByTestId('safe-card-0xOwned').dataset.atLimit).toBe('true')
  })

  it('defaults isAtLimit to false on safe cards when not provided', () => {
    const trusted = [buildSafeItem('0xTrusted')]

    const { getByTestId } = render(
      <OnboardingSafesList trustedSafes={trusted} ownedSafes={[]} similarities={noSimilarities} />,
    )

    expect(getByTestId('safe-card-0xTrusted').dataset.atLimit).toBe('false')
  })

  it('shows the limit-reached notice when isAtLimit', () => {
    const { getByText } = render(
      <OnboardingSafesList trustedSafes={[]} ownedSafes={[]} similarities={noSimilarities} isAtLimit />,
    )

    expect(getByText(/maximum of \d+ Safe accounts per workspace/i)).toBeInTheDocument()
  })

  it('hides the limit-reached notice when below the limit', () => {
    const { queryByText } = render(
      <OnboardingSafesList trustedSafes={[]} ownedSafes={[]} similarities={noSimilarities} />,
    )

    expect(queryByText(/maximum of \d+ Safe accounts per workspace/i)).not.toBeInTheDocument()
  })

  it('passes a match to SafeCard for flagged addresses', () => {
    const trusted = [buildSafeItem('0xflagged')]
    const owned = [buildSafeItem('0xnormal')]
    const similar: Map<string, SelectionSimilarity> = new Map([['0xflagged', { match: INTRA_LIST_MATCH }]])

    const { getByTestId } = render(
      <OnboardingSafesList trustedSafes={trusted} ownedSafes={owned} similarities={similar} />,
    )

    expect(getByTestId('safe-card-0xflagged').dataset.similar).toBe('true')
    expect(getByTestId('safe-card-0xnormal').dataset.similar).toBe('false')
  })
})
