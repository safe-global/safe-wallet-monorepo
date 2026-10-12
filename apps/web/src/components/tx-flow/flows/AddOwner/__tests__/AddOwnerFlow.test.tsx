import { http, HttpResponse } from 'msw'
import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { fakerChecksummedAddress, renderWithUserEvent, screen, waitFor, within } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { createMockSafeTransaction } from '@/tests/transactions'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { createAddOwnerTx } from '@/services/tx/tx-sender'
import AddOwnerFlow from '..'

const SAFE_ADDRESS = fakerChecksummedAddress()
const OWNER = fakerChecksummedAddress()
const ANCHOR = checksumAddress('0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678')
const LOOKALIKE = checksumAddress('0xa1b2ffffffffffffffffffffffffffffffff5678')

const mockChain = chainBuilder()
  .with({ chainId: '11155111', features: [FEATURES.ADDRESS_POISONING_PROTECTION] })
  .build()

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [mockChain], loading: false }),
  useChain: () => mockChain,
  useCurrentChain: () => mockChain,
  useHasFeature: (feature: FEATURES) => mockChain.features.includes(feature),
}))

jest.mock('@/features/safe-shield/hooks', () => ({
  ...jest.requireActual('@/features/safe-shield/hooks'),
  useRecipientAnalysis: () => undefined,
  useCounterpartyAnalysis: () => ({
    recipient: [undefined, undefined, false],
    contract: [undefined, undefined, false],
    deadlock: [undefined, undefined, false],
  }),
  useThreatAnalysis: () => [undefined, undefined, false],
}))

// An untrusted Safe would require risk confirmation on its own, without any poisoning
jest.mock('@/hooks/useIsTrustedSafe', () => ({ __esModule: true, default: () => true }))

jest.mock('@/features/myAccounts/hooks/useTrustSafe', () => ({
  useTrustSafe: () => ({ trustSafe: jest.fn() }),
}))

jest.mock('@/features/hypernative/hooks/useAuthToken', () => ({
  useAuthToken: () => [{ token: undefined }],
}))

jest.mock('@/features/hypernative/hooks/useIsHypernativeEligible', () => ({
  useIsHypernativeEligible: () => ({ isHypernativeEligible: false, isHypernativeGuard: false, loading: false }),
}))

jest.mock('@/features/spaces/hooks/useSafeProAccess', () => ({
  useSafeProAccess: () => ({ hasProFeatures: true, isSafePro: true, isLoading: false, spaceId: null }),
}))

jest.mock('@/services/tx/tx-sender', () => ({
  ...jest.requireActual('@/services/tx/tx-sender'),
  createAddOwnerTx: jest.fn(),
}))

jest.mock('@/services/analytics')

jest.mock('@/hooks/useAddressResolver', () => ({
  useAddressResolver: () => ({ name: undefined, ens: undefined, resolving: false }),
}))

const mockTxPreview = {
  txInfo: {},
  txData: { to: { value: SAFE_ADDRESS }, operation: 0 },
} as unknown as TransactionPreview

const initialReduxState = {
  addressBook: { '11155111': { [ANCHOR]: 'Alice' } },
  safeInfo: {
    data: extendedSafeInfoBuilder()
      .with({
        address: { value: SAFE_ADDRESS },
        chainId: '11155111',
        owners: [{ value: OWNER }],
        threshold: 1,
        deployed: true,
        version: '1.4.1',
      })
      .build(),
    loaded: true,
    loading: false,
  },
}

const getRecipientCard = () =>
  within(screen.getByTestId('pro-checks-section')).getByTestId('recipient-analysis-group-card')

describe('AddOwnerFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(createAddOwnerTx).mockResolvedValue(createMockSafeTransaction({ to: SAFE_ADDRESS, data: '0x' }))
    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:safeAddress/preview`, () =>
        HttpResponse.json(mockTxPreview),
      ),
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/nonces`, () =>
        HttpResponse.json({ currentNonce: 0, recommendedNonce: 0 }),
      ),
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/balances/:currency`, () =>
        HttpResponse.json({ fiatTotal: '0', items: [] }),
      ),
      http.get(`${GATEWAY_URL}/v2/chains/:chainId/delegates`, () =>
        HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
      ),
    )
  })

  it('keeps the address-poisoning warning and risk confirmation on the review step', async () => {
    const { user } = renderWithUserEvent(<AddOwnerFlow address={LOOKALIKE} />, { initialReduxState })

    await waitFor(() => expect(getRecipientCard()).toHaveTextContent('Potential address poisoning'))

    await user.click(screen.getByTestId('add-owner-next-btn'))

    await screen.findByTestId('continue-sign-btn', {}, { timeout: 3000 })
    await waitFor(() => expect(screen.queryByTestId('add-owner-next-btn')).not.toBeInTheDocument())

    expect(createAddOwnerTx).toHaveBeenCalledWith(mockChain, true, { ownerAddress: LOOKALIKE, threshold: 1 })
    expect(getRecipientCard()).toHaveTextContent('Potential address poisoning')
    expect(screen.getByTestId('risk-confirmation-checkbox')).toBeInTheDocument()
  })
})
