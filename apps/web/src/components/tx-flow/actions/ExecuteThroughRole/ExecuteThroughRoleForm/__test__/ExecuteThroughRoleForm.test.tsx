import { createMockSafeTransaction } from '@/tests/transactions'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import { type ReactElement } from 'react'
import * as zodiacRoles from 'zodiac-roles-deployments'
import { fireEvent, render, waitFor, mockWeb3Provider } from '@/tests/test-utils'

import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as wallet from '@/hooks/wallets/useWallet'
import * as onboardHooks from '@/hooks/wallets/useOnboard'
import * as txSender from '@/services/tx/tx-sender/dispatch'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { type OnboardAPI } from '@web3-onboard/core'
import { AbiCoder, ZeroAddress, encodeBytes32String } from 'ethers'
import ExecuteThroughRoleForm from '../index'
import * as hooksModule from '../hooks'
import { chainBuilder } from '@/tests/builders/chains'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

// Mock fetch
Object.defineProperty(window, 'fetch', {
  writable: true,
  value: jest.fn(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve({}),
    }),
  ),
})

// We assume that CheckWallet always returns true
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default({ children }: { children: (ok: boolean) => ReactElement }) {
    return children(true)
  },
}))

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

// mock getModuleTransactionId
jest.mock('@/services/transactions', () => ({
  getModuleTransactionId: jest.fn(() => 'i1234567890'),
}))

// Mock useGasPrice
jest.mock('@/hooks/useGasPrice', () => ({
  __esModule: true,
  default() {
    return [
      {
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
      },
      undefined,
      false,
    ]
  },
}))

describe('ExecuteThroughRoleForm', () => {
  let executeSpy: jest.SpyInstance

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

    // Mock signing and dispatching the module transaction
    executeSpy = jest
      .spyOn(txSender, 'dispatchModuleTxExecution')
      .mockReturnValue(Promise.resolve('0xabababababababababababababababababababababababababababababababab')) // tx hash

    // Mock return value of useWeb3ReadOnly
    // It's only used for eth_estimateGas requests
    mockWeb3Provider([])

    jest.spyOn(hooksModule, 'pollModuleTransactionId').mockReturnValue(Promise.resolve('i1234567890'))
  })

  it('disables the submit button when the call is not allowed and shows the permission check status', async () => {
    mockConnectedWalletAddress(MEMBER_ADDRESS)

    const safeTx = createMockSafeTransaction({
      to: ZeroAddress,
      data: '0xd0e30db0', // deposit()
      value: AbiCoder.defaultAbiCoder().encode(['uint256'], [123]),
      operation: OperationType.Call,
    })

    const { findByText, getByText } = render(
      <ExecuteThroughRoleForm
        txId="0x0123412"
        safeTx={safeTx}
        role={{ ...TEST_ROLE_OK, status: zodiacRoles.Status.TargetAddressNotAllowed }}
      />,
    )
    expect(await findByText('Execute')).toBeDisabled()

    expect(
      getByText(
        textContentMatcher('You are a member of the eth_wrapping role but it does not allow this transaction.'),
      ),
    ).toBeInTheDocument()

    expect(getByText('Role is not allowed to call target address')).toBeInTheDocument()
  })

  it('executes the tx when the submit button is clicked', async () => {
    mockConnectedWalletAddress(MEMBER_ADDRESS)

    const safeTx = createMockSafeTransaction({
      to: WETH_ADDRESS,
      data: '0xd0e30db0', // deposit()
      value: AbiCoder.defaultAbiCoder().encode(['uint256'], [123]),
      operation: OperationType.Call,
    })

    const onSubmit = jest.fn()

    const { findByText } = render(
      <ExecuteThroughRoleForm txId="0x01323" safeTx={safeTx} role={TEST_ROLE_OK} onSubmit={onSubmit} />,
    )

    fireEvent.click(await findByText('Execute'))

    await waitFor(() => {
      expect(executeSpy).toHaveBeenCalledWith(
        // call to the Roles mod's execTransactionWithRole function
        expect.objectContaining({
          to: ROLES_MOD_ADDRESS,
          data: '0xc6fe8747000000000000000000000000fff9976782d46cc05630d1f6ebab18b2324d6b14000000000000000000000000000000000000000000000000000000000000007b00000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000006574685f7772617070696e67000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000004d0e30db000000000000000000000000000000000000000000000000000000000',
          value: '0',
        }),
        undefined,
        expect.anything(),
      )
    })

    // calls provided onSubmit callback
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
  })
})

const ROLES_MOD_ADDRESS = '0x1234567890000000000000000000000000000000'
const MEMBER_ADDRESS = '0x1111111110000000000000000000000000000000'
const ROLE_KEY = encodeBytes32String('eth_wrapping')

const SAFE_INFO = extendedSafeInfoBuilder().build()
SAFE_INFO.modules = [{ value: ROLES_MOD_ADDRESS }]
SAFE_INFO.chainId = '1'

const WETH_ADDRESS = '0xfff9976782d46cc05630d1f6ebab18b2324d6b14'

const TEST_ROLE_OK: hooksModule.Role = {
  modAddress: ROLES_MOD_ADDRESS,
  roleKey: ROLE_KEY as `0x${string}`,
  multiSend: '0x9641d764fc13c8b624c04430c7356c1c7c8102e2',
  status: zodiacRoles.Status.Ok,
}

/**
 * Getting the deepest element that contain string / match regex even when it split between multiple elements
 *
 * @example
 * For:
 * <div>
 *   <span>Hello</span><span> World</span>
 * </div>
 *
 * screen.getByText('Hello World') // ❌ Fail
 * screen.getByText(textContentMatcher('Hello World')) // ✅ pass
 */
function textContentMatcher(textMatch: string | RegExp) {
  const hasText =
    typeof textMatch === 'string'
      ? (node: Element) => node.textContent === textMatch
      : (node: Element) => textMatch.test(node.textContent || '')

  const matcher = (_content: string, node: Element | null) => {
    if (!node || !hasText(node)) {
      return false
    }

    return Array.from(node?.children || []).every((child) => !hasText(child))
  }

  matcher.toString = () => `textContentMatcher(${textMatch})`

  return matcher
}
