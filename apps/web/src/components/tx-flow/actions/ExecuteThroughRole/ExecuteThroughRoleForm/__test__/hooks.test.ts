import { createMockSafeTransaction } from '@/tests/transactions'
import { OperationType } from '@safe-global/types-kit'
import * as zodiacRoles from 'zodiac-roles-deployments'
import { waitFor, renderHook, mockWeb3Provider } from '@/tests/test-utils'

import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as wallet from '@/hooks/wallets/useWallet'
import * as onboardHooks from '@/hooks/wallets/useOnboard'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { type OnboardAPI } from '@web3-onboard/core'
import { AbiCoder, ZeroAddress, encodeBytes32String } from 'ethers'
import { chainBuilder } from '@/tests/builders/chains'
import { useHasFeature } from '@/hooks/useChains'
import { useRoles } from '../hooks'
import { FEATURES } from '@safe-global/utils/utils/chains'

const mockChain = chainBuilder()
  // @ts-expect-error - we are using a local FEATURES enum
  .with({ features: [FEATURES.ZODIAC_ROLES, FEATURES.EIP1559] })
  .with({ chainId: '1' })
  .with({ shortName: 'eth' })
  .with({ chainName: 'Ethereum' })
  .with({ transactionService: 'https://tx.service.mock' })
  .build()

// mock useCurrentChain
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useChains'),
  useCurrentChain: jest.fn(() => mockChain),
  useHasFeature: jest.fn(),
}))

jest.mock('@/hooks/useChainId', () => ({
  useChainId: jest.fn().mockReturnValue(() => '1'),
}))

describe('useRoles', () => {
  let fetchRolesModMock: jest.SpyInstance

  const mockConnectedWalletAddress = (address: string) => {
    // Onboard
    jest.spyOn(onboardHooks, 'default').mockReturnValue({
      setChain: jest.fn(),
      state: {
        get: () => ({
          wallets: [
            {
              label: 'MetaMask',
              accounts: [{ address }],
              connected: true,
              chains: [{ id: '1' }],
            },
          ],
        }),
      },
    } as unknown as OnboardAPI)

    // Wallet
    jest.spyOn(wallet, 'default').mockReturnValue({
      chainId: '1',
      label: 'MetaMask',
      address,
    } as unknown as ConnectedWallet)
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useHasFeature as jest.Mock).mockImplementation((feature) => mockChain.features.includes(feature))

    // Safe info
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: SAFE_INFO,
      safeAddress: SAFE_INFO.address.value,
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    mockWeb3Provider([])

    // Mock the Roles mod fetching function to return the test roles mod
    fetchRolesModMock = jest.spyOn(zodiacRoles, 'fetchRolesMod').mockReturnValue(Promise.resolve(TEST_ROLES_MOD as any))
  })

  it('only fetches and offers roles if the feature is enabled', async () => {
    ;(useHasFeature as jest.Mock).mockImplementation((feature) => feature !== FEATURES.ZODIAC_ROLES)
    mockConnectedWalletAddress(SAFE_INFO.owners[0].value) // connect as safe owner (not a role member)

    const safeTx = createMockSafeTransaction({
      to: ZeroAddress,
      data: '0xd0e30db0', // deposit()
      value: AbiCoder.defaultAbiCoder().encode(['uint256'], [123]),
      operation: OperationType.Call,
    })

    const { result } = renderHook(() => useRoles(safeTx))

    // no roles will be offered
    expect(result.current).toEqual([])
    // no fetch has been triggered
    expect(fetchRolesModMock).not.toHaveBeenCalled()
  })

  it('only offers roles if the user is a member of any role', async () => {
    mockConnectedWalletAddress(SAFE_INFO.owners[0].value) // connect as safe owner (not a role member)

    const safeTx = createMockSafeTransaction({
      to: ZeroAddress,
      data: '0xd0e30db0', // deposit()
      value: AbiCoder.defaultAbiCoder().encode(['uint256'], [123]),
      operation: OperationType.Call,
    })

    const { result } = renderHook(() => useRoles(safeTx))

    // wait for the Roles mod to be fetched & and the cache state update to be propagated
    await waitFor(() => {
      expect(fetchRolesModMock).toBeCalled()
    })
    await new Promise((resolve) => setTimeout(resolve, 25))

    // no role will be offered
    expect(result.current).toEqual([])
  })

  it('reports the role status correctly for allowed calls', async () => {
    mockConnectedWalletAddress(MEMBER_ADDRESS) // connect as a role member

    const safeTxOk = createMockSafeTransaction({
      to: WETH_ADDRESS,
      data: '0xd0e30db0', // deposit()
      value: '0',
      operation: OperationType.Call,
    })

    const { result } = renderHook(() => useRoles(safeTxOk))

    // wait for the Roles mod to be fetched & and the cache state update to be propagated
    await waitFor(() => {
      expect(fetchRolesModMock).toBeCalled()
    })
    await waitFor(() => expect(result.current).toHaveLength(1))

    expect(result.current[0].status).toBe(zodiacRoles.Status.Ok)
  })

  it('reports the role status correctly for calls that are not allowed', async () => {
    mockConnectedWalletAddress(MEMBER_ADDRESS) // connect as a role member

    const safeTxWrongTarget = createMockSafeTransaction({
      to: ZeroAddress,
      data: '0xd0e30db0', // deposit()
      value: '0',
      operation: OperationType.Call,
    })

    const { result } = renderHook(() => useRoles(safeTxWrongTarget))

    // wait for the Roles mod to be fetched & and the cache state update to be propagated
    await waitFor(() => {
      expect(fetchRolesModMock).toBeCalled()
    })
    await waitFor(() => expect(result.current).toHaveLength(1))

    expect(result.current[0].status).toBe(zodiacRoles.Status.TargetAddressNotAllowed)
  })
})

const ROLES_MOD_ADDRESS = '0x1234567890000000000000000000000000000000'
const MEMBER_ADDRESS = '0x1111111110000000000000000000000000000000'
const ROLE_KEY = encodeBytes32String('eth_wrapping')

const SAFE_INFO = extendedSafeInfoBuilder().build()
SAFE_INFO.modules = [{ value: ROLES_MOD_ADDRESS }]
SAFE_INFO.chainId = '1'

const lowercaseSafeAddress = SAFE_INFO.address.value.toLowerCase()

const WETH_ADDRESS = '0xfff9976782d46cc05630d1f6ebab18b2324d6b14'

const { Clearance, ExecutionOptions } = zodiacRoles

const TEST_ROLES_MOD = {
  address: ROLES_MOD_ADDRESS,
  owner: lowercaseSafeAddress,
  avatar: lowercaseSafeAddress,
  target: lowercaseSafeAddress,
  multiSendAddresses: ['0x9641d764fc13c8b624c04430c7356c1c7c8102e2'],
  roles: [
    {
      key: ROLE_KEY,
      members: [MEMBER_ADDRESS],
      targets: [
        {
          address: '0xc36442b4a4522e871399cd717abdd847ab11fe88',
          clearance: Clearance.Function,
          executionOptions: ExecutionOptions.None,
          functions: [
            {
              selector: '0x49404b7c',
              wildcarded: false,
              executionOptions: ExecutionOptions.None,
            },
          ],
        },
        {
          address: WETH_ADDRESS, // WETH
          clearance: Clearance.Function,
          executionOptions: ExecutionOptions.None,
          functions: [
            {
              selector: '0x2e1a7d4d', // withdraw(uint256)
              wildcarded: true,
              executionOptions: ExecutionOptions.None,
            },
            {
              selector: '0xd0e30db0', // deposit()
              wildcarded: true,
              executionOptions: ExecutionOptions.Send,
            },
          ],
        },
      ],
    },
  ],
}
