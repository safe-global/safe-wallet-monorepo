import { faker } from '@faker-js/faker'
import type { ReactNode } from 'react'
import { renderHook } from '@/tests/test-utils'
import { mockSetTxFlow, safeScopeContextFor, TxModalWithScope, unwrapScopedFlow } from '@/tests/mocks/safeScope'
import type { SafeScopeContextValue } from '@safe-global/views/components/tx-flow/safe-scope/types'
import useSetScopedTxFlow from '../useSetScopedTxFlow'

const Flow = () => null

const renderWith = (scope?: SafeScopeContextValue) => {
  const setTxFlow = mockSetTxFlow()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TxModalWithScope setTxFlow={setTxFlow} scope={scope}>
      {children}
    </TxModalWithScope>
  )

  const { result } = renderHook(() => useSetScopedTxFlow(), { wrapper })
  return { setScopedTxFlow: result.current, setTxFlow }
}

describe('useSetScopedTxFlow', () => {
  const target = { chainId: faker.string.numeric(5), safeAddress: faker.finance.ethereumAddress() }

  it('passes the flow and its arguments through unchanged outside a SafeScope', () => {
    const { setScopedTxFlow, setTxFlow } = renderWith()
    const flow = <Flow />
    const onClose = jest.fn()

    setScopedTxFlow(flow, onClose, false)

    expect(setTxFlow.mock.calls).toEqual([[flow, onClose, false]])
  })

  it('does not add arguments the caller omitted outside a SafeScope', () => {
    const { setScopedTxFlow, setTxFlow } = renderWith()
    const flow = <Flow />

    setScopedTxFlow(flow)

    expect(setTxFlow.mock.calls).toEqual([[flow]])
  })

  it('passes the flow through when the provider has no target yet', () => {
    const { setScopedTxFlow, setTxFlow } = renderWith(safeScopeContextFor())
    const flow = <Flow />

    setScopedTxFlow(flow, undefined, false)

    expect(setTxFlow.mock.calls).toEqual([[flow, undefined, false]])
  })

  it('wraps the flow in a non-polling SafeScopeProvider for the scoped Safe', () => {
    const { setScopedTxFlow, setTxFlow } = renderWith(safeScopeContextFor(target))
    const flow = <Flow />
    const onClose = jest.fn()

    setScopedTxFlow(flow, onClose, false)

    const [wrapped, passedOnClose, shouldWarn] = setTxFlow.mock.calls[0]
    expect(unwrapScopedFlow(wrapped)).toEqual({ flow, target, pollSafeInfo: false })
    expect(passedOnClose).toBe(onClose)
    expect(shouldWarn).toBe(false)
  })

  it('closes the flow without wrapping inside a SafeScope', () => {
    const { setScopedTxFlow, setTxFlow } = renderWith(safeScopeContextFor(target))

    setScopedTxFlow(undefined)

    expect(setTxFlow.mock.calls).toEqual([[undefined]])
  })
})
