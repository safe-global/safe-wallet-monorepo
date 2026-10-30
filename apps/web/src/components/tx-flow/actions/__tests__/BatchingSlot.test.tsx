import { type PropsWithChildren } from 'react'
import { renderHook } from '@/tests/test-utils'
import TxFlowProvider from '@/components/tx-flow/TxFlowProvider'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { SlotProvider, SlotName } from '@/components/tx-flow/slots'
import { useSlotIds } from '@/components/tx-flow/slots/hooks'
import BatchingSlot from '../Batching'
import { createMockSafeTransaction } from '@/tests/transactions'
import { OperationType } from '@safe-global/types-kit'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'

jest.mock('@/components/tx-flow/actions/ExecuteThroughRole/ExecuteThroughRoleForm/hooks', () => ({
  ...jest.requireActual('@/components/tx-flow/actions/ExecuteThroughRole/ExecuteThroughRoleForm/hooks'),
  useRoles: jest.fn(() => []),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useCurrentChain: jest.fn(() => ({ chainId: '1', features: [] })),
  useHasFeature: jest.fn((feature: string) => feature === 'BATCHING'),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(() => ({ address: '0x1234567890000000000000000000000000000009', chainId: '1' })),
  useSigner: jest.fn(() => ({ address: '0x1234567890000000000000000000000000000009' })),
}))

jest.mock('@/features/counterfactual', () => ({ useIsCounterfactualSafe: jest.fn(() => false) }))

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  __esModule: true,
  useSafeShield: jest.fn(() => ({ needsRiskConfirmation: false, isRiskConfirmed: false })),
}))

jest.mock('@/hooks/useTxDetails', () => ({ __esModule: true, default: jest.fn(() => [undefined, undefined, false]) }))

jest.mock('@/hooks/useIsSafeOwner', () => ({ __esModule: true, default: jest.fn() }))

jest.mock('@/hooks/useProposers', () => ({ __esModule: true, default: jest.fn(), useIsWalletProposer: jest.fn() }))

jest.mock('@/hooks/useSafeInfo')

jest.mock('@/components/tx/shared/hooks', () => ({
  __esModule: true,
  useAlreadySigned: jest.fn(() => false),
  useImmediatelyExecutable: jest.fn(() => false),
  useValidateNonce: jest.fn(() => true),
  useIsExecutionLoop: jest.fn(() => false),
  useTxActions: jest.fn(),
}))

const safeTx = createMockSafeTransaction({ to: '0x1', data: '0x', operation: OperationType.Call })
const safeInfo = extendedSafeInfoBuilder().build()

const safeTxContext: SafeTxContextParams = {
  safeTx,
  setSafeTx: jest.fn(),
  setSafeMessage: jest.fn(),
  setSafeMessageHash: jest.fn(),
  setSafeTxError: jest.fn(),
  setNonce: jest.fn(),
  setNonceNeeded: jest.fn(),
  setSafeTxGas: jest.fn(),
  setTxOrigin: jest.fn(),
  isReadOnly: false,
  gtfPaymentMode: 'safe',
  setGtfPaymentMode: jest.fn(),
  setGtfSelectedGasToken: jest.fn(),
}

const renderComboSubmitIds = ({ isBatch }: { isBatch: boolean }) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <SafeTxContext.Provider value={safeTxContext}>
      <TxFlowProvider step={0} data={undefined} prevStep={jest.fn()} nextStep={jest.fn()} isBatch={isBatch}>
        <SlotProvider>
          <BatchingSlot />
          {children}
        </SlotProvider>
      </TxFlowProvider>
    </SafeTxContext.Provider>
  )

  return renderHook(() => useSlotIds(SlotName.ComboSubmit), { wrapper: Wrapper })
}

describe('Batching slot', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useSafeInfo).mockReturnValue({
      safe: safeInfo,
      safeAddress: safeInfo.address.value,
      safeLoading: false,
      safeLoaded: true,
      safeError: undefined,
    })
    jest.mocked(useIsSafeOwner).mockReturnValue(true)
  })

  it('offers Add to batch to an owner creating a transaction', () => {
    const { result } = renderComboSubmitIds({ isBatch: false })

    expect(result.current).toContain('batching')
  })

  it('does not offer Add to batch when reviewing a batch', () => {
    const { result } = renderComboSubmitIds({ isBatch: true })

    expect(result.current).not.toContain('batching')
  })
})
