import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { render, screen, waitFor } from '@/tests/test-utils'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { mockHasFeature, mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole } from '@/tests/mocks/roles'
import { RecoveryFeature } from '@/features/recovery'
import SafeModules from '..'
import { zeroPadValue } from 'ethers'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/hooks/useSafeInfo')

jest.mock('@/features/spending-limits', () => ({
  ...jest.requireActual('@/features/spending-limits'),
  useIsOnlySpendingLimitBeneficiary: jest.fn(),
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
    // Warm the lazy recovery chunk so the first test's waitFor does not time out on its import
    beforeAll(() => RecoveryFeature.load())

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
})
