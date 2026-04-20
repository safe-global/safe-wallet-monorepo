import { safeItemBuilder } from '@/tests/builders/safeItem'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { getMultiChainNavigationSafe } from './getMultiChainNavigationSafe'

const overview = (chainId: string, address: string, fiatTotal: string): SafeOverview =>
  ({
    chainId,
    address: { value: address },
    fiatTotal,
  }) as SafeOverview

describe('getMultiChainNavigationSafe', () => {
  const addr = '0x1111111111111111111111111111111111111111'

  it('returns first safe when there are no overviews', () => {
    const a = safeItemBuilder().with({ chainId: '1', address: addr }).build()
    const b = safeItemBuilder().with({ chainId: '100', address: addr }).build()
    expect(getMultiChainNavigationSafe([a, b], undefined)).toBe(a)
  })

  it('returns the safe on the chain with the highest fiat total', () => {
    const eth = safeItemBuilder().with({ chainId: '1', address: addr }).build()
    const gno = safeItemBuilder().with({ chainId: '100', address: addr }).build()
    const overviews = [overview('1', addr, '10'), overview('100', addr, '500')]
    expect(getMultiChainNavigationSafe([eth, gno], overviews)).toBe(gno)
  })

  it('falls back to first safe when overviews do not match any instance', () => {
    const eth = safeItemBuilder().with({ chainId: '1', address: addr }).build()
    const overviews = [overview('137', addr, '999')]
    expect(getMultiChainNavigationSafe([eth], overviews)).toBe(eth)
  })
})
