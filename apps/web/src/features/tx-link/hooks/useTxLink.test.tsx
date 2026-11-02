import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@/tests/test-utils'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import * as useSafeInfoModule from '@/hooks/useSafeInfo'
import { useTxLink } from './useTxLink'

jest.mock('../components/TxLinkFlow', () => ({
  __esModule: true,
  default: () => null,
}))

const RECIPIENT = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const SAFE = 'eth:0x0000000000000000000000000000000000000001'

const mockSafeLoaded = (safeLoaded: boolean) => {
  jest
    .spyOn(useSafeInfoModule, 'default')
    .mockReturnValue({ safeLoaded } as unknown as ReturnType<typeof useSafeInfoModule.default>)
}

const withTxModal = (setTxFlow: TxModalContextType['setTxFlow']) =>
  function TxModalWrapper({ children }: { children: ReactNode }) {
    return (
      <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
        {children}
      </TxModalContext.Provider>
    )
  }

describe('useTxLink', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should, when the link holds valid calls and the Safe is loaded, remove the query and open the flow with the parsed calls', async () => {
    mockSafeLoaded(true)
    const setTxFlow = jest.fn()
    const replace = jest.fn().mockResolvedValue(true)
    const txs = JSON.stringify([{ to: RECIPIENT, value: '1' }])

    renderHook(() => useTxLink(), {
      wrapper: withTxModal(setTxFlow),
      routerProps: { pathname: '/home', query: { safe: SAFE, txs, nonce: '8' }, replace },
    })

    await waitFor(() => expect(setTxFlow).toHaveBeenCalledTimes(1))
    expect(replace).toHaveBeenCalledWith({ pathname: '/home', query: { safe: SAFE } }, undefined, { shallow: true })
    expect(setTxFlow.mock.calls[0][0].props).toEqual({ txs: [{ to: RECIPIENT, value: '1', data: '0x' }], nonce: 8 })
  })

  it('should, when the Safe is not loaded yet, not open the flow', () => {
    mockSafeLoaded(false)
    const setTxFlow = jest.fn()
    const replace = jest.fn().mockResolvedValue(true)

    renderHook(() => useTxLink(), {
      wrapper: withTxModal(setTxFlow),
      routerProps: { pathname: '/home', query: { safe: SAFE, txs: JSON.stringify([{ to: RECIPIENT }]) }, replace },
    })

    expect(replace).not.toHaveBeenCalled()
    expect(setTxFlow).not.toHaveBeenCalled()
  })

  it('should, when the link is invalid, not open the flow and keep the query in the URL', () => {
    mockSafeLoaded(true)
    const setTxFlow = jest.fn()
    const replace = jest.fn().mockResolvedValue(true)

    renderHook(() => useTxLink(), {
      wrapper: withTxModal(setTxFlow),
      routerProps: { pathname: '/home', query: { safe: SAFE, txs: '[{"to":"0x123"}]' }, replace },
    })

    expect(replace).not.toHaveBeenCalled()
    expect(setTxFlow).not.toHaveBeenCalled()
  })
})
