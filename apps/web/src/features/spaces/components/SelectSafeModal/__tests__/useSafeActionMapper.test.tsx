import React from 'react'
import { renderHook, act } from '@testing-library/react'
import useSafeActionMapper from '../useSafeActionMapper'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { AppRoutes } from '@/config/routes'
import { ESafeAction } from '@/features/spaces/store'
import type { SafeItem } from '@/hooks/safes'

const mockReplace = jest.fn()
const mockPush = jest.fn()
const mockQuery = jest.fn<Record<string, string>, []>(() => ({ foo: 'bar' }))

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/current/path',
    query: mockQuery(),
    replace: mockReplace,
    push: mockPush,
  }),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({
    configs: [
      { chainId: '1', shortName: 'eth' },
      { chainId: '137', shortName: 'matic' },
    ],
  }),
}))

jest.mock('@/hooks/safe-apps/useTxBuilderApp', () => ({
  useTxBuilderApp: () => ({
    link: {
      pathname: '/apps/open',
      query: { appUrl: 'https://tx-builder.example' },
    },
  }),
}))

jest.mock('@/components/tx-flow/flows', () => ({
  TokenTransferFlow: () => null,
}))

const mockSafe: SafeItem = {
  chainId: '1',
  address: '0x0000000000000000000000000000000000000001',
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
}

const renderMapper = (onReceiveComplete = jest.fn(), setTxFlow = jest.fn()) => {
  const contextValue: TxModalContextType = {
    txFlow: undefined,
    setTxFlow,
    setFullWidth: jest.fn(),
    fullWidth: false,
  } as unknown as TxModalContextType

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TxModalContext.Provider value={contextValue}>{children}</TxModalContext.Provider>
  )

  return {
    ...renderHook(() => useSafeActionMapper({ onReceiveComplete }), { wrapper }),
    onReceiveComplete,
    setTxFlow,
  }
}

describe('useSafeActionMapper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReplace.mockResolvedValue(true)
    mockPush.mockResolvedValue(true)
    mockQuery.mockReturnValue({ foo: 'bar' })
  })

  it('returns a handler for every ESafeAction', () => {
    const { result } = renderMapper()

    expect(typeof result.current.actionMapper[ESafeAction.Send]).toBe('function')
    expect(typeof result.current.actionMapper[ESafeAction.Receive]).toBe('function')
    expect(typeof result.current.actionMapper[ESafeAction.Swap]).toBe('function')
    expect(typeof result.current.actionMapper[ESafeAction.BuildTransaction]).toBe('function')
  })

  describe(ESafeAction.Send, () => {
    it('navigates to the Safe and opens the TokenTransferFlow with a reset-on-close callback', async () => {
      const { result, setTxFlow } = renderMapper()

      await act(async () => {
        await result.current.actionMapper[ESafeAction.Send](mockSafe)
      })

      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/current/path',
        query: { foo: 'bar', safe: `eth:${mockSafe.address}` },
      })
      expect(setTxFlow).toHaveBeenCalledTimes(1)
      expect(setTxFlow).toHaveBeenCalledWith(expect.anything(), expect.any(Function), false)
    })

    it('awaits navigation before opening the tx flow', async () => {
      const callOrder: string[] = []
      mockReplace.mockImplementation(() => {
        callOrder.push('replace')
        return Promise.resolve(true)
      })
      const setTxFlow = jest.fn(() => {
        callOrder.push('setTxFlow')
      })

      const { result } = renderMapper(jest.fn(), setTxFlow)

      await act(async () => {
        await result.current.actionMapper[ESafeAction.Send](mockSafe)
      })

      expect(callOrder).toEqual(['replace', 'setTxFlow'])
    })
  })

  describe(ESafeAction.Receive, () => {
    it('navigates to the Safe and invokes onReceiveComplete', async () => {
      const { result, onReceiveComplete } = renderMapper()

      await act(async () => {
        await result.current.actionMapper[ESafeAction.Receive](mockSafe)
      })

      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/current/path',
        query: { foo: 'bar', safe: `eth:${mockSafe.address}` },
      })
      expect(onReceiveComplete).toHaveBeenCalledTimes(1)
    })

    it('does not open a tx flow', async () => {
      const { result, setTxFlow } = renderMapper()

      await act(async () => {
        await result.current.actionMapper[ESafeAction.Receive](mockSafe)
      })

      expect(setTxFlow).not.toHaveBeenCalled()
    })
  })

  describe(ESafeAction.Swap, () => {
    it('pushes the swap route with the safe query param', async () => {
      const { result } = renderMapper()

      await act(async () => {
        await result.current.actionMapper[ESafeAction.Swap](mockSafe)
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.swap,
        query: { safe: `eth:${mockSafe.address}` },
      })
      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('resolves the shortName from the chainId', async () => {
      const { result } = renderMapper()

      await act(async () => {
        await result.current.actionMapper[ESafeAction.Swap]({ ...mockSafe, chainId: '137' })
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.swap,
        query: { safe: `matic:${mockSafe.address}` },
      })
    })

    it('falls back to an empty shortName for unknown chains', async () => {
      const { result } = renderMapper()

      await act(async () => {
        await result.current.actionMapper[ESafeAction.Swap]({ ...mockSafe, chainId: '999' })
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.swap,
        query: { safe: `:${mockSafe.address}` },
      })
    })
  })

  describe(ESafeAction.BuildTransaction, () => {
    it('pushes the tx-builder link and merges the safe param into its query', async () => {
      const { result } = renderMapper()

      await act(async () => {
        await result.current.actionMapper[ESafeAction.BuildTransaction](mockSafe)
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/apps/open',
        query: { appUrl: 'https://tx-builder.example', safe: `eth:${mockSafe.address}` },
      })
    })
  })

  describe('resetActiveSafe', () => {
    it('strips the safe and chain query params while preserving the rest', async () => {
      mockQuery.mockReturnValue({ foo: 'bar', safe: 'eth:0xabc', chain: 'eth' })
      const { result } = renderMapper()

      await act(async () => {
        await result.current.resetActiveSafe()
      })

      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/current/path',
        query: { foo: 'bar' },
      })
    })

    it('is used as the Send tx flow onClose callback so closing the modal clears the active safe', async () => {
      mockQuery.mockReturnValue({ foo: 'bar', safe: 'eth:0xabc', chain: 'eth' })
      const { result, setTxFlow } = renderMapper()

      await act(async () => {
        await result.current.actionMapper[ESafeAction.Send](mockSafe)
      })

      const onClose = setTxFlow.mock.calls[0][1] as () => Promise<void>
      mockReplace.mockClear()

      await act(async () => {
        await onClose()
      })

      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/current/path',
        query: { foo: 'bar' },
      })
    })
  })
})
