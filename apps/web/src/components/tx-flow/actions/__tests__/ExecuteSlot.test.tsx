import { type PropsWithChildren, type ReactElement } from 'react'
import { renderHook, waitFor } from '@/tests/test-utils'
import TxFlowProvider from '@/components/tx-flow/TxFlowProvider'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { SlotProvider, SlotName } from '@/components/tx-flow/slots'
import { useSlotIds } from '@/components/tx-flow/slots/hooks'
import SignSlot from '../Sign'
import ExecuteSlot from '../Execute'
import { createMockSafeTransaction } from '@/tests/transactions'
import { OperationType } from '@safe-global/types-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import { EthSafeSignature } from '@safe-global/protocol-kit'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSigner } from '@/hooks/wallets/useWallet'
import * as walletUtils from '@/utils/wallets'
import { useImmediatelyExecutable } from '@/components/tx/shared/hooks'
import { faker } from '@faker-js/faker'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useCurrentChain: jest.fn(() => ({ chainId: '1', features: [] })),
  useHasFeature: jest.fn(() => false),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(),
  useSigner: jest.fn(),
}))

jest.mock('@/features/counterfactual', () => ({ useIsCounterfactualSafe: jest.fn(() => false) }))

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  __esModule: true,
  useSafeShield: jest.fn(() => ({ needsRiskConfirmation: false, isRiskConfirmed: false })),
}))

jest.mock('@/hooks/useTxDetails', () => ({ __esModule: true, default: jest.fn(() => [undefined, undefined, false]) }))

jest.mock('@/hooks/useIsSafeOwner', () => ({ __esModule: true, default: jest.fn(() => true) }))

jest.mock('@/hooks/useProposers', () => ({
  __esModule: true,
  default: jest.fn(),
  useIsWalletProposer: jest.fn(() => false),
}))

jest.mock('@/hooks/useSafeInfo')

jest.mock('@/components/tx/shared/hooks', () => ({
  __esModule: true,
  useAlreadySigned: jest.fn(() => false),
  useImmediatelyExecutable: jest.fn(() => false),
  useValidateNonce: jest.fn(() => true),
  useIsExecutionLoop: jest.fn(() => false),
  useTxActions: jest.fn(),
}))

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactElement }) => children(true),
}))

const signerAddress = faker.finance.ethereumAddress()
const safeInfo = extendedSafeInfoBuilder().build()

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseSigner = useSigner as jest.MockedFunction<typeof useSigner>
const mockIsSmartContractWallet = jest.spyOn(walletUtils, 'isSmartContractWallet')
const mockUseImmediatelyExecutable = useImmediatelyExecutable as jest.MockedFunction<typeof useImmediatelyExecutable>

const buildSafeTx = ({
  signed,
  otherSignatures = 0,
}: {
  signed: boolean
  otherSignatures?: number
}): SafeTransaction => {
  const safeTx = createMockSafeTransaction({
    to: faker.finance.ethereumAddress(),
    data: '0x',
    operation: OperationType.Call,
  })
  if (signed) {
    safeTx.addSignature(new EthSafeSignature(signerAddress, faker.string.hexadecimal({ length: 130 })))
  }
  for (let i = 0; i < otherSignatures; i++) {
    safeTx.addSignature(
      new EthSafeSignature(faker.finance.ethereumAddress(), faker.string.hexadecimal({ length: 130 })),
    )
  }
  return safeTx
}

const buildSafeTxContext = (safeTx: SafeTransaction): SafeTxContextParams => ({
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
  gtfPaymentMode: 'signer',
  setGtfPaymentMode: jest.fn(),
  setGtfSelectedGasToken: jest.fn(),
})

const mockSafe = (threshold: number) =>
  mockUseSafeInfo.mockReturnValue({
    safe: { ...safeInfo, threshold, nonce: 0 },
    safeAddress: safeInfo.address.value,
    safeLoading: false,
    safeLoaded: true,
    safeError: undefined,
  } as ReturnType<typeof useSafeInfo>)

const mockSigner = ({ isSafe }: { isSafe: boolean }) =>
  mockUseSigner.mockReturnValue({ address: signerAddress, chainId: '1', isSafe } as ReturnType<typeof useSigner>)

describe('Execute slot', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafe(1)
    mockSigner({ isSafe: false })
    mockIsSmartContractWallet.mockResolvedValue(false)
    mockUseImmediatelyExecutable.mockReturnValue(true)
  })

  const renderSlotIds = ({
    safeTx,
    txId,
    isExecutable,
  }: {
    safeTx: SafeTransaction
    txId?: string
    isExecutable?: boolean
  }) => {
    const Wrapper = ({ children }: PropsWithChildren) => (
      <SafeTxContext.Provider value={buildSafeTxContext(safeTx)}>
        <TxFlowProvider
          step={0}
          data={undefined}
          prevStep={jest.fn()}
          nextStep={jest.fn()}
          txId={txId}
          isExecutable={isExecutable}
        >
          <SlotProvider>
            <SignSlot />
            <ExecuteSlot />
            {children}
          </SlotProvider>
        </TxFlowProvider>
      </SafeTxContext.Provider>
    )
    return renderHook(() => useSlotIds(SlotName.ComboSubmit), { wrapper: Wrapper })
  }

  it('offers only Sign for an unsigned transaction on a 1/n Safe', async () => {
    const { result } = renderSlotIds({ safeTx: buildSafeTx({ signed: false }) })

    await waitFor(() => {
      expect(result.current).toContain('sign')
      expect(result.current).not.toContain('execute')
    })
  })

  it('offers Execute once the 1/n transaction carries a signature', async () => {
    const { result } = renderSlotIds({
      safeTx: buildSafeTx({ signed: true }),
      txId: 'multisig_0x1_0x2',
      isExecutable: true,
    })

    await waitFor(() => {
      expect(result.current).toContain('execute')
    })
  })

  it('keeps Execute for the last signer on an m/n Safe', async () => {
    mockSafe(2)
    mockUseImmediatelyExecutable.mockReturnValue(false)

    const { result } = renderSlotIds({
      safeTx: buildSafeTx({ signed: false, otherSignatures: 1 }),
      txId: 'multisig_0x1_0x2',
      isExecutable: true,
    })

    await waitFor(() => {
      expect(result.current).toContain('execute')
      expect(result.current).toContain('sign')
    })
  })

  it('offers Execute for a fully signed transaction on an m/n Safe', async () => {
    mockSafe(2)
    mockUseImmediatelyExecutable.mockReturnValue(false)

    const { result } = renderSlotIds({
      safeTx: buildSafeTx({ signed: false, otherSignatures: 2 }),
      txId: 'multisig_0x1_0x2',
      isExecutable: true,
    })

    await waitFor(() => {
      expect(result.current).toContain('execute')
      expect(result.current).not.toContain('sign')
    })
  })

  it('keeps Execute for a nested Safe signer on a 1/n Safe', async () => {
    mockSigner({ isSafe: true })

    const { result } = renderSlotIds({ safeTx: buildSafeTx({ signed: false }) })

    await waitFor(() => {
      expect(result.current).toContain('execute')
    })
  })

  it('keeps Execute for a smart-account signer on a 1/n Safe', async () => {
    mockIsSmartContractWallet.mockResolvedValue(true)

    const { result } = renderSlotIds({ safeTx: buildSafeTx({ signed: false }) })

    await waitFor(() => {
      expect(result.current).toContain('execute')
    })
  })
})
