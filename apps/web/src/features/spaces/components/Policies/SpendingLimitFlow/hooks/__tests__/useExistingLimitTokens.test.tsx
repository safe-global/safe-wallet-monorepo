import { getAddress } from 'ethers'
import { renderHook } from '@/tests/test-utils'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import type { SpendingLimitState } from '@/features/spending-limits'
import { EditModeProvider } from '../../EditFlow/EditModeContext'
import { ExistingSpendingLimitsContext } from '../../ExistingSpendingLimitsProvider'
import { useExistingLimitTokens } from '../useExistingLimitTokens'

const UNTRUSTED = getAddress('0x00000000000000000000000000000000000000e1')

const limitOn = (address: string, decimals: number | null): SpendingLimitState =>
  spendingLimitStateBuilder()
    .with({ token: { address, symbol: 'UNTRUSTED', decimals, logoUri: '' } })
    .build()

const renderIn = (limits: SpendingLimitState[], edit: boolean) =>
  renderHook(() => useExistingLimitTokens(), {
    wrapper: ({ children }) => {
      const scoped = (
        <ExistingSpendingLimitsContext.Provider value={{ limits, loading: false, error: undefined }}>
          {children}
        </ExistingSpendingLimitsContext.Provider>
      )
      return edit ? <EditModeProvider>{scoped}</EditModeProvider> : scoped
    },
  })

describe('useExistingLimitTokens', () => {
  it('offers a token the balances endpoint withholds, so an edit can resolve it', () => {
    const { result } = renderIn([limitOn(UNTRUSTED, 18)], true)

    expect(result.current).toEqual([
      { address: UNTRUSTED, symbol: 'UNTRUSTED', name: 'UNTRUSTED', decimals: 18, logoUri: '', group: 'held' },
    ])
  })

  it('offers nothing in the create flow, which only writes tokens its lists already had', () => {
    const { result } = renderIn([limitOn(UNTRUSTED, 18)], false)

    expect(result.current).toEqual([])
  })

  it('leaves out a token whose decimals the chain never yielded rather than standing in a zero', () => {
    const { result } = renderIn([limitOn(UNTRUSTED, null)], true)

    expect(result.current).toEqual([])
  })
})
