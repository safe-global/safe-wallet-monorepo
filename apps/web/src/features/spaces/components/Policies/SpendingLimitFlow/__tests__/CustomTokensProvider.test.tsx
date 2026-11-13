import type { ReactNode } from 'react'
import { act, renderHook } from '@/tests/test-utils'
import { tokenOptionBuilder } from '../utils/tokenOptions.testData'
import { CustomTokensProvider, useAddCustomToken, useCustomTokens } from '../CustomTokensProvider'

const wrapper = ({ children }: { children: ReactNode }) => <CustomTokensProvider>{children}</CustomTokensProvider>

const renderCustomTokens = (chainId: string) =>
  renderHook(() => ({ tokens: useCustomTokens(chainId), addToken: useAddCustomToken() }), { wrapper })

describe('CustomTokensProvider', () => {
  it('returns an added token on its own chain only', () => {
    const token = tokenOptionBuilder().with({ group: 'custom' }).build()
    const { result } = renderCustomTokens('1')

    act(() => result.current.addToken('100', token))
    expect(result.current.tokens).toEqual([])

    act(() => result.current.addToken('1', token))
    expect(result.current.tokens).toEqual([token])
  })

  it('keeps one entry per address whatever its casing', () => {
    const token = tokenOptionBuilder().with({ group: 'custom' }).build()
    const { result } = renderCustomTokens('1')

    act(() => {
      result.current.addToken('1', token)
      result.current.addToken('1', { ...token, address: token.address.toLowerCase() })
    })

    expect(result.current.tokens).toEqual([token])
  })

  it('returns nothing outside the provider', () => {
    const { result } = renderHook(() => useCustomTokens('1'))

    expect(result.current).toEqual([])
  })
})
