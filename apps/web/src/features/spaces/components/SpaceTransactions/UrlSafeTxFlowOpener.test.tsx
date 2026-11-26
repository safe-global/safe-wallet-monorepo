import { useContext, useState, type ReactElement, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { mockSetTxFlow } from '@/tests/mocks/safeScope'
import { TxModalContext } from '@/components/tx-flow'
import * as notifications from '@/store/notificationsSlice'
import { ScopedTxFlowOpenerContext } from '@/components/tx-flow/safe-scope/ScopedTxFlowOpener'
import * as safeCoreSDK from '@/hooks/coreSDK/safeCoreSDK'
import * as useSafeInfoModule from '@/hooks/useSafeInfo'
import UrlSafeTxFlowOpener, { LOAD_TIMEOUT_MS } from './UrlSafeTxFlowOpener'

const Flow = () => null

const sepoliaSafe = safeInfoBuilder().with({ chainId: '11155111' }).build()
const otherSafe = safeInfoBuilder().with({ chainId: '11155111' }).build()
const target = { chainId: sepoliaSafe.chainId, safeAddress: sepoliaSafe.address.value }

const sdkFor = (safe: typeof sepoliaSafe) =>
  ({
    getAddress: async () => safe.address.value,
    getChainId: async () => BigInt(safe.chainId),
  }) as never

let urlSafe: typeof sepoliaSafe | undefined
let urlSdk: ReturnType<typeof sdkFor> | undefined

const setUrlSafe = (safe: typeof sepoliaSafe | undefined, sdk = safe && sdkFor(safe)) => {
  urlSafe = safe
  urlSdk = sdk
}

const TxModal = ({ setTxFlow, children }: { setTxFlow: jest.Mock; children: ReactNode }) => {
  const [txFlow, setFlow] = useState<ReactElement>()
  setTxFlow.mockImplementation((flow?: ReactElement) => setFlow(flow))
  return (
    <TxModalContext.Provider value={{ txFlow, setTxFlow, setFullWidth: jest.fn() }}>{children}</TxModalContext.Provider>
  )
}

const renderOpener = () => {
  const setTxFlow = mockSetTxFlow()
  const replace = jest.fn().mockResolvedValue(true)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TxModal setTxFlow={setTxFlow}>
      <UrlSafeTxFlowOpener>{children}</UrlSafeTxFlowOpener>
    </TxModal>
  )
  const hook = renderHook(() => useContext(ScopedTxFlowOpenerContext), {
    wrapper,
    routerProps: { pathname: '/spaces/transactions', query: { spaceId: '1' }, replace },
  })
  return { ...hook, setTxFlow, replace }
}

describe('UrlSafeTxFlowOpener', () => {
  beforeEach(() => {
    setUrlSafe(undefined)
    jest.spyOn(useSafeInfoModule, 'default').mockImplementation(
      () =>
        ({
          safe: urlSafe ?? safeInfoBuilder().build(),
          safeAddress: urlSafe?.address.value ?? '',
          safeLoaded: !!urlSafe,
          safeLoading: false,
        }) as ReturnType<typeof useSafeInfoModule.default>,
    )
    jest.spyOn(safeCoreSDK, 'useSafeSDK').mockImplementation(() => urlSdk)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('puts the row Safe in the URL', () => {
    const { result, replace } = renderOpener()

    act(() => result.current?.(target, <Flow />))

    expect(replace).toHaveBeenCalledWith({
      pathname: '/spaces/transactions',
      query: { spaceId: '1', safe: `sep:${target.safeAddress}`, chain: 'sep' },
    })
  })

  it('waits for the row Safe info and SDK before opening the flow', async () => {
    const { result, rerender, setTxFlow } = renderOpener()
    const flow = <Flow />

    act(() => result.current?.(target, flow, undefined, false))
    expect(setTxFlow).not.toHaveBeenCalled()

    setUrlSafe(otherSafe)
    rerender()
    await act(async () => {})
    expect(setTxFlow).not.toHaveBeenCalled()

    setUrlSafe(sepoliaSafe)
    rerender()
    await waitFor(() => expect(setTxFlow).toHaveBeenCalledTimes(1))
    const [opened, , shouldWarn] = setTxFlow.mock.calls[0]
    expect(opened).toBe(flow)
    expect(shouldWarn).toBe(false)
  })

  it('does not open the flow while the SDK still belongs to the previous Safe', async () => {
    const { result, rerender, setTxFlow } = renderOpener()

    act(() => result.current?.(target, <Flow />))
    setUrlSafe(sepoliaSafe, sdkFor(otherSafe))
    rerender()
    await act(async () => {})

    expect(setTxFlow).not.toHaveBeenCalled()
  })

  it('passes the caller onClose to the flow', async () => {
    const { result, rerender, setTxFlow } = renderOpener()
    const onClose = jest.fn()

    act(() => result.current?.(target, <Flow />, onClose))
    setUrlSafe(sepoliaSafe)
    rerender()

    await waitFor(() => expect(setTxFlow).toHaveBeenCalledTimes(1))
    expect(setTxFlow.mock.calls[0][1]).toBe(onClose)
  })

  it('clears the URL Safe once the flow ends, however it ends', async () => {
    const { result, rerender, setTxFlow, replace } = renderOpener()

    act(() => result.current?.(target, <Flow />))
    setUrlSafe(sepoliaSafe)
    rerender()
    await waitFor(() => expect(setTxFlow).toHaveBeenCalledTimes(1))
    act(() => setTxFlow(<Flow />))
    expect(replace).toHaveBeenCalledTimes(1)

    act(() => setTxFlow(undefined))

    expect(replace).toHaveBeenLastCalledWith({
      pathname: '/spaces/transactions',
      query: { spaceId: '1', safe: undefined, chain: undefined },
    })
  })

  it('shows an error and clears the URL Safe when the SDK fails', async () => {
    const notify = jest.spyOn(notifications, 'showNotification')
    const { result, rerender, setTxFlow, replace } = renderOpener()

    act(() => result.current?.(target, <Flow />))
    setUrlSafe(sepoliaSafe, { getAddress: () => Promise.reject(new Error('rpc')), getChainId: async () => 1n } as never)
    rerender()

    await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' })))
    expect(setTxFlow).not.toHaveBeenCalled()
    expect(replace).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ safe: undefined }) }),
    )
  })

  it('shows an error when the Safe never loads', () => {
    jest.useFakeTimers()
    const notify = jest.spyOn(notifications, 'showNotification')
    const { result, setTxFlow } = renderOpener()

    act(() => result.current?.(target, <Flow />))
    act(() => jest.advanceTimersByTime(LOAD_TIMEOUT_MS))

    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }))
    expect(setTxFlow).not.toHaveBeenCalled()
    jest.useRealTimers()
  })
})
