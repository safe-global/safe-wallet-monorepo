import { renderHook } from '@/tests/test-utils'
import useSyncSafeCreationStep from '@/components/new-safe/create/useSyncSafeCreationStep'
import * as wallet from '@/hooks/wallets/useWallet'
import * as currentChain from '@/hooks/useChains'
import * as localStorage from '@/services/local-storage/useLocalStorage'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import * as useIsWrongChain from '@/hooks/useIsWrongChain'
import * as useRouter from 'next/router'
import { type NextRouter } from 'next/router'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

describe('useSyncSafeCreationStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should go to the first step if no wallet is connected and there is no pending safe', async () => {
    const mockPushRoute = jest.fn()
    jest.spyOn(wallet, 'default').mockReturnValue(null)
    jest.spyOn(useRouter, 'useRouter').mockReturnValue({
      push: mockPushRoute,
    } as unknown as NextRouter)
    const mockSetStep = jest.fn()

    renderHook(() => useSyncSafeCreationStep(mockSetStep, []))

    expect(mockSetStep).toHaveBeenCalledWith(0)
  })

  it('should go to the first step if the wrong chain is connected', async () => {
    jest.spyOn(localStorage, 'default').mockReturnValue([{}, jest.fn()])
    jest.spyOn(wallet, 'default').mockReturnValue({ address: '0x1' } as ConnectedWallet)
    jest.spyOn(currentChain, 'useCurrentChain').mockReturnValue({ chainId: '100' } as Chain)

    const mockSetStep = jest.fn()

    renderHook(() => useSyncSafeCreationStep(mockSetStep, [{ chainId: '4' } as Chain]))

    expect(mockSetStep).toHaveBeenCalledWith(0)
  })

  it('should not do anything if wallet is connected and there is no pending safe', async () => {
    jest.spyOn(localStorage, 'default').mockReturnValue([undefined, jest.fn()])
    jest.spyOn(wallet, 'default').mockReturnValue({ address: '0x1' } as ConnectedWallet)
    jest.spyOn(useIsWrongChain, 'default').mockReturnValue(false)

    const mockSetStep = jest.fn()

    renderHook(() => useSyncSafeCreationStep(mockSetStep, []))

    expect(mockSetStep).not.toHaveBeenCalled()
  })
})
