import { faker } from '@faker-js/faker'
import type { ReactNode } from 'react'
import { render } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { safeScopeContextFor } from '@/tests/mocks/safeScope'
import { SafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import { AppRoutes } from '@/config/routes'
import { CopyDeeplinkLabels } from '@/services/analytics'
import TxShareLink from './TxShareLink'

jest.mock('@/components/common/CopyTooltip', () => ({
  __esModule: true,
  default: ({ text, children }: { text: string; children: ReactNode }) => <div data-testid={text}>{children}</div>,
}))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useChain: jest.fn(),
  useCurrentChain: jest.fn(),
}))
jest.mock('@/hooks/useSafeAddress')

const mockUseCurrentChain = jest.mocked(useCurrentChain)
const mockUseSafeAddress = jest.mocked(useSafeAddress)

describe('TxShareLink', () => {
  const txId = faker.string.alphanumeric(20)
  const spaceId = faker.string.uuid()
  const urlSafe = `eth:${faker.finance.ethereumAddress()}`
  const scopedChain = chainBuilder().with({ chainId: '137', shortName: 'matic' }).build()
  const scopedSafeAddress = faker.finance.ethereumAddress()
  const scope = safeScopeContextFor({ chainId: scopedChain.chainId, safeAddress: scopedSafeAddress })

  const renderLink = (query: Record<string, string>, inScope = false) => {
    const link = (
      <TxShareLink id={txId} eventLabel={CopyDeeplinkLabels.shareBlock}>
        <button>Share</button>
      </TxShareLink>
    )
    const { container } = render(
      inScope ? <SafeScopeContext.Provider value={scope}>{link}</SafeScopeContext.Provider> : link,
      { routerProps: { query } },
    )
    return container.querySelector('[data-testid]')?.getAttribute('data-testid')
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCurrentChain.mockReturnValue(scopedChain)
    mockUseSafeAddress.mockReturnValue(scopedSafeAddress)
  })

  it('links to the URL Safe on a Safe-level page', () => {
    expect(renderLink({ safe: urlSafe })).toBe(
      `${window.location.origin}${AppRoutes.transactions.tx}?safe=${urlSafe}&id=${txId}`,
    )
  })

  it('keeps the spaceId of the URL on a Safe-level page', () => {
    expect(renderLink({ safe: urlSafe, spaceId })).toBe(
      `${window.location.origin}${AppRoutes.transactions.tx}?safe=${urlSafe}&id=${txId}&spaceId=${spaceId}`,
    )
  })

  it("links to the row's scoped Safe and keeps the spaceId on a Space page", () => {
    expect(renderLink({ spaceId }, true)).toBe(
      `${window.location.origin}${AppRoutes.transactions.tx}?safe=matic:${scopedSafeAddress}&id=${txId}&spaceId=${spaceId}`,
    )
  })

  it('leaves the Safe empty in a scope until its chain config resolves', () => {
    mockUseCurrentChain.mockReturnValue(undefined)

    expect(renderLink({ spaceId }, true)).toBe(
      `${window.location.origin}${AppRoutes.transactions.tx}?safe=&id=${txId}&spaceId=${spaceId}`,
    )
  })
})
