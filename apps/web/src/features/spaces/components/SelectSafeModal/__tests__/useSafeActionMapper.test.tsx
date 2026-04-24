import React from 'react'
import { renderHook, act } from '@testing-library/react'
import useSafeActionMapper from '../useSafeActionMapper'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { AppRoutes } from '@/config/routes'
import { ESafeAction } from '@/features/spaces/store'
import type { SafeItem } from '@/hooks/safes'

const mockReplace = jest.fn()
const mockPush = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/current/path',
    query: { foo: 'bar' },
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
  })

  it('returns a handler for every ESafeAction', () => {
    const { result } = renderMapper()

    expect(typeof result.current[ESafeAction.Send]).toBe('function')
    expect(typeof result.current[ESafeAction.Receive]).toBe('function')
    expect(typeof result.current[ESafeAction.Swap]).toBe('function')
    expect(typeof result.current[ESafeAction.BuildTransaction]).toBe('function')
  })

  describe(ESafeAction.Send, () => {
    it('navigates to the Safe and opens the TokenTransferFlow', async () => {
      const { result, setTxFlow } = renderMapper()

      await act(async () => {
        await result.current[ESafeAction.Send](mockSafe)
      })

      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/current/path',
        query: { foo: 'bar', safe: `eth:${mockSafe.address}` },
      })
      expect(setTxFlow).toHaveBeenCalledTimes(1)
      expect(setTxFlow).toHaveBeenCalledWith(expect.anything(), undefined, false)
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
        await result.current[ESafeAction.Send](mockSafe)
      })

      expect(callOrder).toEqual(['replace', 'setTxFlow'])
    })
  })

  describe(ESafeAction.Receive, () => {
    it('navigates to the Safe and invokes onReceiveComplete', async () => {
      const { result, onReceiveComplete } = renderMapper()

      await act(async () => {
        await result.current[ESafeAction.Receive](mockSafe)
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
        await result.current[ESafeAction.Receive](mockSafe)
      })

      expect(setTxFlow).not.toHaveBeenCalled()
    })
  })

  describe(ESafeAction.Swap, () => {
    it('pushes the swap route with the safe query param', async () => {
      const { result } = renderMapper()

      await act(async () => {
        await result.current[ESafeAction.Swap](mockSafe)
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
        await result.current[ESafeAction.Swap]({ ...mockSafe, chainId: '137' })
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: AppRoutes.swap,
        query: { safe: `matic:${mockSafe.address}` },
      })
    })

    it('falls back to an empty shortName for unknown chains', async () => {
      const { result } = renderMapper()

      await act(async () => {
        await result.current[ESafeAction.Swap]({ ...mockSafe, chainId: '999' })
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
        await result.current[ESafeAction.BuildTransaction](mockSafe)
      })

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/apps/open',
        query: { appUrl: 'https://tx-builder.example', safe: `eth:${mockSafe.address}` },
      })
    })
  })
})
