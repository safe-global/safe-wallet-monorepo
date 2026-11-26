import { useContext, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { mockSetTxFlow, TxModalWithScope } from '@/tests/mocks/safeScope'
import { ScopedTxFlowOpenerContext } from '@/components/tx-flow/safe-scope/ScopedTxFlowOpener'
import * as safeCoreSDK from '@/hooks/coreSDK/safeCoreSDK'
import * as useSafeInfoModule from '@/hooks/useSafeInfo'
import UrlSafeTxFlowOpener from './UrlSafeTxFlowOpener'

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

const renderOpener = () => {
  const setTxFlow = mockSetTxFlow()
  const replace = jest.fn().mockResolvedValue(true)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TxModalWithScope setTxFlow={setTxFlow}>
      <UrlSafeTxFlowOpener>{children}</UrlSafeTxFlowOpener>
    </TxModalWithScope>
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

  it('clears the URL Safe and calls the caller onClose when the flow closes', async () => {
    const { result, rerender, setTxFlow, replace } = renderOpener()
    const onClose = jest.fn()

    act(() => result.current?.(target, <Flow />, onClose))
    setUrlSafe(sepoliaSafe)
    rerender()
    await waitFor(() => expect(setTxFlow).toHaveBeenCalledTimes(1))
    replace.mockClear()

    act(() => setTxFlow.mock.calls[0][1]?.())

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith({
      pathname: '/spaces/transactions',
      query: { spaceId: '1', safe: undefined, chain: undefined },
    })
  })
})
