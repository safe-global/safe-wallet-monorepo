import type { ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import type { OnboardAPI, WalletState } from '@web3-onboard/core'
import type { JsonRpcProvider } from 'ethers'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { SafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import { act, fakerChecksummedAddress, mockWeb3Provider, renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { chainBuilder } from '@/tests/builders/chains'
import { addressExBuilder, safeInfoBuilder } from '@/tests/builders/safe'
import { eip1193ProviderBuilder } from '@/tests/builders/eip1193Provider'
import { safeScopeContextFor } from '@/tests/mocks/safeScope'
import { useWalletContext } from '@/hooks/wallets/useWallet'
import * as useOnboardModule from '@/hooks/wallets/useOnboard'
import * as nestedSafeWalletModule from '@/utils/nested-safe-wallet'
import type { WalletContextType } from './WalletContext'
import WalletProvider from '.'
import ScopedWalletProvider from './ScopedWalletProvider'

jest.mock('@/hooks/useChains')

const mockUseCurrentChain = jest.requireMock('@/hooks/useChains').useCurrentChain as jest.Mock

// The app-wide chain (URL or wallet) differs from the scoped Safe's chain, as in the Workspace
const ROOT_CHAIN_ID = '1'
const SCOPE_CHAIN_ID = '137'

const walletState = (address: string, chainId: string): WalletState => ({
  label: 'MetaMask',
  icon: '',
  provider: eip1193ProviderBuilder().build(),
  accounts: [{ address: address as `0x${string}`, ens: null, uns: null, balance: null }],
  chains: [{ id: `0x${Number(chainId).toString(16)}`, namespace: 'evm' }],
})

const mockOnboard = (wallets: WalletState[]) => {
  const onboard = {
    state: {
      get: () => ({ wallets }),
      select: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    },
  }
  jest.spyOn(useOnboardModule, 'default').mockReturnValue(onboard as unknown as OnboardAPI)
}

const safeAt = (address: string, chainId: string, threshold: number): SafeState =>
  safeInfoBuilder()
    .with({ address: addressExBuilder().with({ value: address }).build(), chainId, threshold })
    .build()

const mockCgwSafes = (safes: SafeState[]) => {
  const lookups: { chainId: string; address: string }[] = []
  server.use(
    http.get<{ chainId: string; safeAddress: string }>(
      `${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`,
      ({ params }) => {
        lookups.push({ chainId: params.chainId, address: params.safeAddress })
        const safe = safes.find((s) => s.chainId === params.chainId && sameAddress(s.address.value, params.safeAddress))
        return safe ? HttpResponse.json(safe) : HttpResponse.json({ code: 404, message: 'Not found' }, { status: 404 })
      },
    ),
  )
  return lookups
}

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)))

const scopedWeb3ReadOnly = { scoped: true } as unknown as JsonRpcProvider

const renderScoped = (withScope = true) => {
  const root: { current: WalletContextType | null } = { current: null }
  const RootProbe = () => {
    root.current = useWalletContext()
    return null
  }
  const scopeValue = withScope
    ? (() => {
        const value = safeScopeContextFor({ chainId: SCOPE_CHAIN_ID, safeAddress: fakerChecksummedAddress() })
        return { ...value, scope: value.scope && { ...value.scope, web3ReadOnly: scopedWeb3ReadOnly } }
      })()
    : safeScopeContextFor()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <WalletProvider>
      <RootProbe />
      <SafeScopeContext.Provider value={scopeValue}>
        <ScopedWalletProvider>{children}</ScopedWalletProvider>
      </SafeScopeContext.Provider>
    </WalletProvider>
  )
  const view = renderHook(() => useWalletContext(), { wrapper })
  return { ...view, root }
}

describe('ScopedWalletProvider', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.spyOn(useOnboardModule, 'useIsWalletReady').mockReturnValue(true)
    mockUseCurrentChain.mockReturnValue(chainBuilder().with({ chainId: ROOT_CHAIN_ID }).build())
    mockWeb3Provider([])
  })

  it('resolves the picked parent Safe on the scoped chain, not the app-wide chain', async () => {
    const getNestedWalletSpy = jest.spyOn(nestedSafeWalletModule, 'getNestedWallet')
    const ownerAddress = fakerChecksummedAddress()
    const parentSafeAddress = fakerChecksummedAddress()
    mockOnboard([walletState(ownerAddress, ROOT_CHAIN_ID)])
    const lookups = mockCgwSafes([safeAt(parentSafeAddress, SCOPE_CHAIN_ID, 2)])

    const { result, root } = renderScoped()
    act(() => result.current?.setSignerAddress(parentSafeAddress))

    await waitFor(() => expect(result.current?.signer?.isSafe).toBe(true))
    expect(result.current?.signer).toMatchObject({ address: parentSafeAddress, chainId: SCOPE_CHAIN_ID, threshold: 2 })
    expect(lookups).toContainEqual({ chainId: SCOPE_CHAIN_ID, address: parentSafeAddress })
    // Built with the scoped chain's provider, so the parent Safe tx is read and sent on that chain
    expect(getNestedWalletSpy.mock.lastCall?.[2]).toBe(scopedWeb3ReadOnly)

    // The app-wide provider can't see the scope and keeps the plain wallet
    expect(root.current?.signer?.isSafe).toBeUndefined()
    expect(root.current?.signer?.address).toBe(ownerAddress)
  })

  it('stores the pick and the parent Safe nonce in the app-wide provider', async () => {
    const parentSafeAddress = fakerChecksummedAddress()
    mockOnboard([walletState(fakerChecksummedAddress(), ROOT_CHAIN_ID)])
    mockCgwSafes([safeAt(parentSafeAddress, SCOPE_CHAIN_ID, 2)])

    const { result, root } = renderScoped()
    act(() => result.current?.setSignerAddress(parentSafeAddress))
    act(() => result.current?.setParentSafeNonce(7))

    expect(root.current?.signerAddress).toBe(parentSafeAddress)
    expect(root.current?.getParentSafeNonce()).toBe(7)

    await waitFor(() => expect(result.current?.signer?.isSafe).toBe(true))

    // Closing the flow resets the selection from the app root
    act(() => root.current?.setSignerAddress(undefined))
    await settle()
    expect(result.current?.signer?.isSafe).toBeUndefined()
    expect(result.current?.getParentSafeNonce()).toBeUndefined()
  })

  it('does not take a parent Safe that only exists on the app-wide chain as the scoped signer', async () => {
    const ownerAddress = fakerChecksummedAddress()
    const parentSafeAddress = fakerChecksummedAddress()
    mockOnboard([walletState(ownerAddress, ROOT_CHAIN_ID)])
    const lookups = mockCgwSafes([safeAt(parentSafeAddress, ROOT_CHAIN_ID, 2)])

    const { result, root } = renderScoped()
    act(() => result.current?.setSignerAddress(parentSafeAddress))

    await waitFor(() => expect(root.current?.signer?.isSafe).toBe(true))
    await waitFor(() => expect(lookups).toContainEqual({ chainId: SCOPE_CHAIN_ID, address: parentSafeAddress }))
    await settle()
    expect(result.current?.signer?.isSafe).toBeUndefined()
    expect(result.current?.signer?.address).toBe(ownerAddress)
  })

  it('marks a connected wallet that is a Safe on the scoped chain as a connected Safe', async () => {
    const address = fakerChecksummedAddress()
    mockOnboard([walletState(address, SCOPE_CHAIN_ID)])
    mockCgwSafes([safeAt(address, SCOPE_CHAIN_ID, 3)])

    const { result, root } = renderScoped()

    await waitFor(() => expect(result.current?.signer?.isConnectedSafe).toBe(true))
    expect(result.current?.signer?.threshold).toBe(3)
    // The app-wide chain differs from the wallet chain, so the root doesn't flag it
    expect(root.current?.signer?.isConnectedSafe).toBeUndefined()
  })

  it('does not mark a connected wallet that is a Safe only on the app-wide chain as a connected Safe', async () => {
    const address = fakerChecksummedAddress()
    mockOnboard([walletState(address, ROOT_CHAIN_ID)])
    mockCgwSafes([safeAt(address, ROOT_CHAIN_ID, 3)])

    const { result, root } = renderScoped()

    await waitFor(() => expect(root.current?.signer?.isConnectedSafe).toBe(true))
    await settle()
    expect(result.current?.signer?.isConnectedSafe).toBeUndefined()
    expect(result.current?.signer?.address).toBe(address)
  })

  it('passes the app-wide context through unchanged until a Safe is scoped', async () => {
    const ownerAddress = fakerChecksummedAddress()
    mockOnboard([walletState(ownerAddress, ROOT_CHAIN_ID)])
    const lookups = mockCgwSafes([])

    const { result, root } = renderScoped(false)
    await settle()

    expect(result.current).toBe(root.current)
    expect(lookups.every(({ chainId }) => chainId === ROOT_CHAIN_ID)).toBe(true)
  })
})
