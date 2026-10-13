import { type ReactElement } from 'react'
import { act, render, screen } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import type { SafeTransaction } from '@safe-global/types-kit'
import TxFlowProvider from '@/components/tx-flow/TxFlowProvider'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { SlotProvider } from '@/components/tx-flow/slots'
import type { SignerWallet } from '@/components/common/WalletProvider'
import { ComboSubmit } from '../ComboSubmit'
import SignSlot from '../Sign'
import ExecuteSlot from '../Execute'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { safeSignatureBuilder, safeTxBuilder } from '@/tests/builders/safeTx'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSigner } from '@/hooks/wallets/useWallet'
import * as walletUtils from '@/utils/wallets'
import { useImmediatelyExecutable } from '@/components/tx/shared/hooks'

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

jest.mock('@/hooks/useValidateTxData', () => ({ useValidateTxData: jest.fn(() => [undefined, undefined, false]) }))

jest.mock('@/services/local-storage/useLocalStorage', () => ({
  __esModule: true,
  default: jest.fn(() => [undefined, jest.fn()]),
}))

jest.mock('@/components/tx/shared/hooks', () => ({
  __esModule: true,
  useAlreadySigned: jest.fn(() => false),
  useImmediatelyExecutable: jest.fn(() => false),
  useValidateNonce: jest.fn(() => true),
  useIsExecutionLoop: jest.fn(() => false),
  useTxActions: jest.fn(() => ({
    signTx: jest.fn(),
    executeTx: jest.fn(),
    signProposerTx: jest.fn(),
    proposeTx: jest.fn(),
  })),
}))

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactElement }) => children(true),
}))

jest.mock('../Execute/ExecuteForm', () => {
  const SplitMenuButton = jest.requireActual('@safe-global/views/components/common/SplitMenuButton').default
  return {
    __esModule: true,
    default: ({ options, slotId }: { options: Array<{ id: string; label?: string }>; slotId?: string }) => (
      <SplitMenuButton options={options} selected={slotId} />
    ),
  }
})

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseSigner = useSigner as jest.MockedFunction<typeof useSigner>
const mockUseImmediatelyExecutable = useImmediatelyExecutable as jest.MockedFunction<typeof useImmediatelyExecutable>
const mockIsSmartContractWallet = jest.spyOn(walletUtils, 'isSmartContractWallet')

const buildSafeTx = (signatureCount: number): SafeTransaction => {
  const signatures = Array.from({ length: signatureCount }, () => safeSignatureBuilder().build())
  return safeTxBuilder()
    .with({ signatures: new Map(signatures.map((signature) => [signature.signer, signature])) })
    .build()
}

const buildTxId = () => `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64 })}`

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

const mockSafe = (threshold: number) => {
  const safe = extendedSafeInfoBuilder().build()
  mockUseSafeInfo.mockReturnValue({
    safe: { ...safe, threshold },
    safeAddress: safe.address.value,
    safeLoading: false,
    safeLoaded: true,
    safeError: undefined,
  } as ReturnType<typeof useSafeInfo>)
}

type SignerCase = {
  name: string
  signer: Omit<SignerWallet, 'address' | 'provider'>
  isSmartContract: boolean
}

const signerCases: SignerCase[] = [
  { name: 'an EOA', signer: { chainId: '1' }, isSmartContract: false },
  { name: 'a parent Safe connected in-app', signer: { chainId: '1', isSafe: true }, isSmartContract: true },
  {
    name: 'a parent Safe connected over WalletConnect',
    signer: { chainId: '1', isConnectedSafe: true, threshold: 1 },
    isSmartContract: true,
  },
  { name: 'a smart-contract wallet', signer: { chainId: '1' }, isSmartContract: true },
]

type FlowCase = {
  name: string
  threshold: number
  signatureCount: number
  isQueued: boolean
  isExecutable: boolean
}

const unsignedFlowCases: FlowCase[] = [
  { name: 'a new tx on a 1/n Safe', threshold: 1, signatureCount: 0, isQueued: false, isExecutable: false },
  { name: 'a queued unsigned tx on a 1/n Safe', threshold: 1, signatureCount: 0, isQueued: true, isExecutable: true },
  { name: 'a new tx on an m/n Safe', threshold: 2, signatureCount: 0, isQueued: false, isExecutable: false },
  {
    name: 'the last missing signature of an m/n Safe',
    threshold: 2,
    signatureCount: 1,
    isQueued: true,
    isExecutable: true,
  },
  {
    name: 'an m/n tx still missing other signatures',
    threshold: 3,
    signatureCount: 1,
    isQueued: true,
    isExecutable: false,
  },
]

const renderSubmit = ({ threshold, signatureCount, isQueued, isExecutable }: FlowCase) => {
  mockSafe(threshold)
  mockUseImmediatelyExecutable.mockReturnValue(!isQueued && threshold === 1)

  return render(
    <SafeTxContext.Provider value={buildSafeTxContext(buildSafeTx(signatureCount))}>
      <TxFlowProvider
        step={0}
        data={undefined}
        prevStep={jest.fn()}
        nextStep={jest.fn()}
        txId={isQueued ? buildTxId() : undefined}
        isExecutable={isExecutable}
      >
        <SlotProvider>
          <SignSlot />
          <ExecuteSlot />
          <ComboSubmit onSubmit={jest.fn()} slotId="" />
        </SlotProvider>
      </TxFlowProvider>
    </SafeTxContext.Provider>,
  )
}

const settleSignerCheck = () => act(async () => {})

describe.each(signerCases)('Sign before execute with $name', ({ signer, isSmartContract }) => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSigner.mockReturnValue({ ...signer, address: faker.finance.ethereumAddress(), provider: null })
    mockIsSmartContractWallet.mockResolvedValue(isSmartContract)
  })

  it.each(unsignedFlowCases)('offers only Sign for $name', async (flow) => {
    renderSubmit(flow)
    await settleSignerCheck()

    expect(screen.getByTestId('combo-submit-sign')).toHaveTextContent('Sign')
    expect(screen.queryByTestId('combo-submit-execute')).not.toBeInTheDocument()
    expect(screen.queryByTestId('combo-submit-dropdown')).not.toBeInTheDocument()
    expect(screen.queryByText('Execute')).not.toBeInTheDocument()
  })

  it('offers only Execute for a fully signed tx', async () => {
    renderSubmit({ name: 'fully signed', threshold: 2, signatureCount: 2, isQueued: true, isExecutable: true })
    await settleSignerCheck()

    expect(await screen.findByTestId('combo-submit-execute')).toHaveTextContent('Execute')
    expect(screen.queryByTestId('combo-submit-sign')).not.toBeInTheDocument()
  })
})
