import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { render, screen, waitFor } from '@/tests/test-utils'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { mockHasFeature, mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole } from '@/tests/mocks/roles'
import userEvent from '@testing-library/user-event'
import useRecovery from '@/features/recovery/public/useRecovery'
import type { RecoveryStateItem } from '@/features/recovery/public/types'
import { TxModalContext } from '@/components/tx-flow'
import { RemoveModuleFlow } from '@/components/tx-flow/flows/RemoveModuleFlow'
import { RemoveRecoveryFlow } from '@/components/tx-flow/flows/RemoveRecoveryFlow'
import SafeModules from '..'
import { zeroPadValue } from 'ethers'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/hooks/useSafeInfo')

jest.mock('@/features/spending-limits/public/useIsOnlySpendingLimitBeneficiary', () => ({
  ...jest.requireActual('@/features/spending-limits/public/useIsOnlySpendingLimitBeneficiary'),
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/features/recovery/public/useRecovery', () => ({
  ...jest.requireActual('@/features/recovery/public/useRecovery'),
  __esModule: true,
  default: jest.fn(() => [undefined, undefined, false]),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useChain: jest.fn(),
  useCurrentChain: jest.fn(),
  useHasFeature: jest.fn(),
}))

const NOT_CONNECTED = 'Please connect your wallet'
const NOT_OWNER = 'Your connected wallet is not a signer of this Safe account'

const MOCK_MODULE_1 = zeroPadValue('0x01', 20)
const MOCK_MODULE_2 = zeroPadValue('0x02', 20)

const delayModifierAt = (address: string): RecoveryStateItem => ({
  address,
  recoverers: [],
  expiry: 0n,
  delay: 0n,
  txNonce: 0n,
  queueNonce: 0n,
  queue: [],
})

describe('SafeModules', () => {
  const extendedSafeInfo = extendedSafeInfoBuilder().build()

  it('should render placeholder label without any modules', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: extendedSafeInfo,
      safeAddress: '0x123',
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    const utils = render(<SafeModules />)
    await waitFor(() => expect(utils.getByText('No modules enabled')).toBeDefined())
  })

  it('should render placeholder label if safe is loading', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: extendedSafeInfo,
      safeAddress: '',
      safeError: undefined,
      safeLoading: true,
      safeLoaded: false,
    }))

    const utils = render(<SafeModules />)
    await waitFor(() => expect(utils.getByText('No modules enabled')).toBeDefined())
  })
  it('should render module addresses for defined modules', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: {
        ...extendedSafeInfo,
        modules: [
          {
            value: MOCK_MODULE_1,
          },
          {
            value: MOCK_MODULE_2,
          },
        ],
      },
      safeAddress: '0x123',
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    const utils = render(<SafeModules />)
    await waitFor(() => expect(utils.getByText(MOCK_MODULE_1)).toBeDefined())
    await waitFor(() => expect(utils.getByText(MOCK_MODULE_2)).toBeDefined())
  })

  describe('remove module button', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockSafeInfo({ deployed: true, modules: [{ value: MOCK_MODULE_1 }] })
      mockHasFeature(true)
    })

    it.each(['owner', 'proposer', 'nestedOwner'] as const)('is enabled for %s', async (role) => {
      mockRole(role)

      render(<SafeModules />)

      await waitFor(() => expect(screen.getByTestId('module-remove-btn')).toBeEnabled())
    })

    it('is enabled for an owner on a chain without recovery', async () => {
      mockHasFeature(false)
      mockRole('owner')

      render(<SafeModules />)

      await waitFor(() => expect(screen.getByTestId('module-remove-btn')).toBeEnabled())
    })

    it.each([
      ['nonOwner', NOT_OWNER],
      ['spendingLimitBeneficiary', NOT_OWNER],
      ['disconnected', NOT_CONNECTED],
    ] as const)('is disabled for %s with the reason "%s"', async (role, reason) => {
      mockRole(role)

      render(<SafeModules />)

      expect(await screen.findByLabelText(reason)).toContainElement(screen.getByTestId('module-remove-btn'))
      expect(screen.getByTestId('module-remove-btn')).toBeDisabled()
    })
  })

  describe('remove module flow', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockSafeInfo({ deployed: true, modules: [{ value: MOCK_MODULE_1 }, { value: MOCK_MODULE_2 }] })
      mockHasFeature(true)
      mockRole('owner')
      jest.mocked(useRecovery).mockReturnValue([[delayModifierAt(MOCK_MODULE_1)], undefined, false])
    })

    const removeModule = async (moduleIndex: number) => {
      const setTxFlow = jest.fn()
      render(
        <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
          <SafeModules />
        </TxModalContext.Provider>,
      )
      const button = (await screen.findAllByTestId('module-remove-btn'))[moduleIndex]
      await waitFor(() => expect(button).toBeEnabled())
      await userEvent.click(button)
      return setTxFlow
    }

    it('opens the recovery removal for the Delay modifier of the recovery', async () => {
      const setTxFlow = await removeModule(0)

      expect(setTxFlow).toHaveBeenCalledWith(
        expect.objectContaining({
          type: RemoveRecoveryFlow,
          props: { delayModifier: expect.objectContaining({ address: MOCK_MODULE_1 }) },
        }),
      )
    })

    it('opens the module removal for any other module', async () => {
      const setTxFlow = await removeModule(1)

      expect(setTxFlow).toHaveBeenCalledWith(
        expect.objectContaining({ type: RemoveModuleFlow, props: { address: MOCK_MODULE_2 } }),
      )
    })
  })
})
