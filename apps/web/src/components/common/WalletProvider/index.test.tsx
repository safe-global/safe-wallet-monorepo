import { http, HttpResponse } from 'msw'
import type { OnboardAPI, WalletState } from '@web3-onboard/core'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { act, fakerChecksummedAddress, mockWeb3Provider, renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { chainBuilder } from '@/tests/builders/chains'
import { addressExBuilder, safeInfoBuilder } from '@/tests/builders/safe'
import { eip1193ProviderBuilder } from '@/tests/builders/eip1193Provider'
import { useWalletContext } from '@/hooks/wallets/useWallet'
import * as useOnboardModule from '@/hooks/wallets/useOnboard'
import WalletProvider from '.'

jest.mock('@/hooks/useChains')

const mockUseCurrentChain = jest.requireMock('@/hooks/useChains').useCurrentChain as jest.Mock

const CURRENT_CHAIN_ID = '1'
const OTHER_CHAIN_ID = '137'

const walletState = (address: string, chainId: string): WalletState => ({
  label: 'MetaMask',
  icon: '',
  provider: eip1193ProviderBuilder().build(),
  accounts: [{ address: address as `0x${string}`, ens: null, uns: null, balance: null }],
  chains: [{ id: `0x${Number(chainId).toString(16)}`, namespace: 'evm' }],
})

const mockOnboard = (initialWallets: WalletState[]) => {
  let wallets = initialWallets
  let listener: ((next: WalletState[]) => void) | undefined
  const onboard = {
    state: {
      get: () => ({ wallets }),
      select: () => ({
        subscribe: (next: (value: WalletState[]) => void) => {
          listener = next
          return { unsubscribe: () => (listener = undefined) }
        },
      }),
    },
  }
  jest.spyOn(useOnboardModule, 'default').mockReturnValue(onboard as unknown as OnboardAPI)

  return (next: WalletState[]) =>
    act(() => {
      wallets = next
      listener?.(next)
    })
}

const setCurrentChain = (chainId: string) => {
  mockUseCurrentChain.mockReturnValue(chainBuilder().with({ chainId }).build())
}

const safeAt = (address: string, chainId: string, threshold: number): SafeState =>
  safeInfoBuilder()
    .with({ address: addressExBuilder().with({ value: address }).build(), chainId, threshold })
    .build()

type SafeLookup = { chainId: string; address: string }

const mockCgwSafes = (safes: SafeState[], options: { pending?: Promise<void> } = {}): SafeLookup[] => {
  const lookups: SafeLookup[] = []
  server.use(
    http.get<{ chainId: string; safeAddress: string }>(
      `${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`,
      async ({ params }) => {
        lookups.push({ chainId: params.chainId, address: params.safeAddress })
        await options.pending
        const safe = safes.find((s) => s.chainId === params.chainId && sameAddress(s.address.value, params.safeAddress))
        return safe ? HttpResponse.json(safe) : HttpResponse.json({ code: 404, message: 'Not found' }, { status: 404 })
      },
    ),
  )
  return lookups
}

// Lets in-flight CGW requests reach MSW and settle before asserting that nothing changed
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)))

const renderWalletContext = () => renderHook(() => useWalletContext(), { wrapper: WalletProvider })

describe('WalletProvider', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.spyOn(useOnboardModule, 'useIsWalletReady').mockReturnValue(true)
    setCurrentChain(CURRENT_CHAIN_ID)
  })

  describe('connected Safe detection', () => {
    it('provides no signer and looks nothing up when no wallet is connected', async () => {
      mockOnboard([])
      const lookups = mockCgwSafes([])

      const { result } = renderWalletContext()
      await settle()

      expect(result.current?.signer).toBeNull()
      expect(lookups).toEqual([])
    })

    it('keeps a connected EOA as a plain signer when CGW has no Safe at its address', async () => {
      const address = fakerChecksummedAddress()
      mockOnboard([walletState(address, CURRENT_CHAIN_ID)])
      const lookups = mockCgwSafes([])

      const { result } = renderWalletContext()
      await waitFor(() => expect(lookups).toContainEqual({ chainId: CURRENT_CHAIN_ID, address }))
      await settle()

      expect(result.current?.signer).toEqual(result.current?.connectedWallet)
      expect(result.current?.signer).not.toHaveProperty('isConnectedSafe')
    })

    it('marks a connected wallet that is a Safe on the current chain as a connected Safe with its threshold', async () => {
      const address = fakerChecksummedAddress()
      mockOnboard([walletState(address, CURRENT_CHAIN_ID)])
      mockCgwSafes([safeAt(address, CURRENT_CHAIN_ID, 3)])

      const { result } = renderWalletContext()

      await waitFor(() => expect(result.current?.signer?.isConnectedSafe).toBe(true))
      expect(result.current?.signer).toEqual({
        ...result.current?.connectedWallet,
        isConnectedSafe: true,
        threshold: 3,
      })
      expect(result.current?.signer?.isSafe).toBeUndefined()
    })

    it('keeps the signer plain while the CGW lookup is in flight', async () => {
      const address = fakerChecksummedAddress()
      mockOnboard([walletState(address, CURRENT_CHAIN_ID)])
      let respond = () => {}
      const pending = new Promise<void>((resolve) => (respond = resolve))
      const lookups = mockCgwSafes([safeAt(address, CURRENT_CHAIN_ID, 2)], { pending })

      const { result } = renderWalletContext()
      await waitFor(() => expect(lookups).toHaveLength(1))

      expect(result.current?.signer).toEqual(result.current?.connectedWallet)

      respond()
      await waitFor(() => expect(result.current?.signer?.isConnectedSafe).toBe(true))
    })

    it('keeps the signer plain when the CGW lookup fails', async () => {
      const address = fakerChecksummedAddress()
      mockOnboard([walletState(address, CURRENT_CHAIN_ID)])
      const lookups: string[] = []
      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, ({ params }) => {
          lookups.push(String(params.safeAddress))
          return HttpResponse.json({ message: 'Internal error' }, { status: 500 })
        }),
      )

      const { result } = renderWalletContext()
      await waitFor(() => expect(lookups).toContain(address))
      await settle()

      expect(result.current?.signer).toEqual(result.current?.connectedWallet)
    })

    it('does not look up or mark a wallet connected on another chain than the current Safe', async () => {
      const address = fakerChecksummedAddress()
      mockOnboard([walletState(address, OTHER_CHAIN_ID)])
      const lookups = mockCgwSafes([safeAt(address, CURRENT_CHAIN_ID, 2), safeAt(address, OTHER_CHAIN_ID, 2)])

      const { result } = renderWalletContext()
      await settle()

      expect(result.current?.signer).toEqual(result.current?.connectedWallet)
      expect(result.current?.signer).not.toHaveProperty('isConnectedSafe')
      expect(lookups).toEqual([])
    })

    it('detects the connected Safe once the wallet switches to the current chain', async () => {
      const address = fakerChecksummedAddress()
      const emitWallets = mockOnboard([walletState(address, OTHER_CHAIN_ID)])
      const lookups = mockCgwSafes([safeAt(address, CURRENT_CHAIN_ID, 4)])

      const { result } = renderWalletContext()
      await settle()
      expect(result.current?.signer?.isConnectedSafe).toBeUndefined()

      emitWallets([walletState(address, CURRENT_CHAIN_ID)])

      await waitFor(() => expect(result.current?.signer?.isConnectedSafe).toBe(true))
      expect(result.current?.signer?.threshold).toBe(4)
      expect(lookups).toEqual([{ chainId: CURRENT_CHAIN_ID, address }])
    })

    it('drops the connected Safe flag when the current chain changes away from the wallet chain', async () => {
      const address = fakerChecksummedAddress()
      mockOnboard([walletState(address, CURRENT_CHAIN_ID)])
      mockCgwSafes([safeAt(address, CURRENT_CHAIN_ID, 2), safeAt(address, OTHER_CHAIN_ID, 2)])

      const { result, rerender } = renderWalletContext()
      await waitFor(() => expect(result.current?.signer?.isConnectedSafe).toBe(true))

      setCurrentChain(OTHER_CHAIN_ID)
      rerender()
      await settle()

      expect(result.current?.signer).toEqual(result.current?.connectedWallet)
      expect(result.current?.signer).not.toHaveProperty('isConnectedSafe')
    })

    it('drops the connected Safe flag when the user switches to an EOA account', async () => {
      const safeAddress = fakerChecksummedAddress()
      const eoaAddress = fakerChecksummedAddress()
      const emitWallets = mockOnboard([walletState(safeAddress, CURRENT_CHAIN_ID)])
      mockCgwSafes([safeAt(safeAddress, CURRENT_CHAIN_ID, 2)])

      const { result } = renderWalletContext()
      await waitFor(() => expect(result.current?.signer?.isConnectedSafe).toBe(true))

      emitWallets([walletState(eoaAddress, CURRENT_CHAIN_ID)])

      await waitFor(() => expect(result.current?.signer?.address).toBe(eoaAddress))
      await settle()
      expect(result.current?.signer).not.toHaveProperty('isConnectedSafe')
    })
  })

  describe('in-app nested Safe signer', () => {
    beforeEach(() => {
      mockWeb3Provider([])
    })

    it('uses the selected nested Safe as the signer instead of the connected EOA', async () => {
      const ownerAddress = fakerChecksummedAddress()
      const nestedSafeAddress = fakerChecksummedAddress()
      mockOnboard([walletState(ownerAddress, CURRENT_CHAIN_ID)])
      mockCgwSafes([safeAt(nestedSafeAddress, CURRENT_CHAIN_ID, 2)])

      const { result } = renderWalletContext()
      act(() => result.current?.setSignerAddress(nestedSafeAddress))

      await waitFor(() => expect(result.current?.signer?.isSafe).toBe(true))
      expect(result.current?.signer).toMatchObject({ address: nestedSafeAddress, threshold: 2 })
      expect(result.current?.signer?.isConnectedSafe).toBeUndefined()
      expect(result.current?.connectedWallet?.address).toBe(ownerAddress)
    })

    it('prefers the selected nested Safe over a connected wallet that is itself a Safe', async () => {
      const connectedSafeAddress = fakerChecksummedAddress()
      const nestedSafeAddress = fakerChecksummedAddress()
      mockOnboard([walletState(connectedSafeAddress, CURRENT_CHAIN_ID)])
      mockCgwSafes([safeAt(connectedSafeAddress, CURRENT_CHAIN_ID, 3), safeAt(nestedSafeAddress, CURRENT_CHAIN_ID, 1)])

      const { result } = renderWalletContext()
      await waitFor(() => expect(result.current?.signer?.isConnectedSafe).toBe(true))

      act(() => result.current?.setSignerAddress(nestedSafeAddress))

      await waitFor(() => expect(result.current?.signer?.isSafe).toBe(true))
      expect(result.current?.signer).toMatchObject({ address: nestedSafeAddress, threshold: 1 })
      expect(result.current?.signer?.isConnectedSafe).toBeUndefined()
    })

    it('keeps the connected Safe as the signer when the connected address itself is selected', async () => {
      const address = fakerChecksummedAddress()
      mockOnboard([walletState(address, CURRENT_CHAIN_ID)])
      mockCgwSafes([safeAt(address, CURRENT_CHAIN_ID, 3)])

      const { result } = renderWalletContext()
      act(() => result.current?.setSignerAddress(address))

      await waitFor(() => expect(result.current?.signer?.isConnectedSafe).toBe(true))
      await settle()
      expect(result.current?.signer?.isSafe).toBeUndefined()
      expect(result.current?.signer?.threshold).toBe(3)
    })

    it('falls back to the connected Safe when the nested signer is cleared', async () => {
      const connectedSafeAddress = fakerChecksummedAddress()
      const nestedSafeAddress = fakerChecksummedAddress()
      mockOnboard([walletState(connectedSafeAddress, CURRENT_CHAIN_ID)])
      mockCgwSafes([safeAt(connectedSafeAddress, CURRENT_CHAIN_ID, 3), safeAt(nestedSafeAddress, CURRENT_CHAIN_ID, 1)])

      const { result } = renderWalletContext()
      act(() => result.current?.setSignerAddress(nestedSafeAddress))
      await waitFor(() => expect(result.current?.signer?.isSafe).toBe(true))

      act(() => result.current?.setSignerAddress(undefined))

      await waitFor(() => expect(result.current?.signer?.isConnectedSafe).toBe(true))
      expect(result.current?.signer).toMatchObject({ address: connectedSafeAddress, threshold: 3 })
    })
  })
})
