import { faker } from '@faker-js/faker'
import { waitFor } from '@testing-library/react'
import { render, fakerChecksummedAddress } from '@/tests/test-utils'
import { extendedSafeInfoBuilder, addressExBuilder } from '@/tests/builders/safe'
import { chainBuilder } from '@/tests/builders/chains'
import { PendingStatus, PendingTxType, type PendingProcessingTx } from '@/store/pendingTxsSlice'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import * as useChains from '@/hooks/useChains'
import { createExistingTx } from '@/services/tx/tx-sender'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import SpeedUpModal from '.'

const SIGNER_ADDRESS = fakerChecksummedAddress()
const SAFE_ADDRESS = fakerChecksummedAddress()

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/hooks/wallets/useOnboard', () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}))

jest.mock('@/hooks/useSafeAddress', () => ({
  __esModule: true,
  default: jest.fn(() => SAFE_ADDRESS),
}))

jest.mock('@/hooks/useSafeInfo')

jest.mock('@/hooks/useIsWrongChain', () => ({
  __esModule: true,
  default: jest.fn(() => false),
}))

jest.mock('@/hooks/useGasPrice', () => ({
  __esModule: true,
  default: jest.fn(() => [{ maxFeePerGas: BigInt(1e9), maxPriorityFeePerGas: BigInt(1e8) }, undefined, false]),
}))

jest.mock('@/services/tx/tx-sender', () => ({
  createExistingTx: jest.fn(),
  dispatchSafeTxSpeedUp: jest.fn(),
  dispatchCustomTxSpeedUp: jest.fn(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  useLazyTransactionsGetTransactionByIdV1Query: jest.fn(() => [jest.fn(() => Promise.resolve({ data: undefined }))]),
}))

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockCreateExistingTx = createExistingTx as jest.MockedFunction<typeof createExistingTx>
const mockUseIsWrongChain = useIsWrongChain as jest.MockedFunction<typeof useIsWrongChain>

const pendingTx: PendingProcessingTx = {
  chainId: '1',
  safeAddress: SAFE_ADDRESS,
  nonce: 5,
  txHash: faker.string.hexadecimal({ length: 64 }),
  submittedAt: Date.now(),
  signerNonce: 7,
  signerAddress: SIGNER_ADDRESS,
  gasLimit: '150000',
  status: PendingStatus.PROCESSING,
  txType: PendingTxType.SAFE_TX,
}

const setSafeOwners = (owners: string[]) => {
  mockUseSafeInfo.mockReturnValue({
    safeAddress: SAFE_ADDRESS,
    safe: extendedSafeInfoBuilder()
      .with({ address: { value: SAFE_ADDRESS } })
      .with({ chainId: '1' })
      .with({ deployed: true })
      .with({ owners: owners.map((value) => addressExBuilder().with({ value }).build()) })
      .build(),
    safeLoaded: true,
    safeLoading: false,
    safeError: undefined,
  } as unknown as ReturnType<typeof useSafeInfo>)
}

const renderModal = () =>
  render(
    <SpeedUpModal
      open
      handleClose={jest.fn()}
      pendingTx={pendingTx}
      txId={`multisig_${SAFE_ADDRESS}_0xabc`}
      txHash={pendingTx.txHash}
      signerAddress={SIGNER_ADDRESS}
      signerNonce={pendingTx.signerNonce}
      gasLimit={pendingTx.gasLimit}
    />,
  )

describe('SpeedUpModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chainBuilder().with({ chainId: '1' }).build())
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
    mockUseIsWrongChain.mockReturnValue(false)
    mockUseWallet.mockReturnValue({ address: SIGNER_ADDRESS, provider: {} } as unknown as ConnectedWallet)
    mockCreateExistingTx.mockResolvedValue({
      data: { nonce: 5 },
      signatures: new Map([[SIGNER_ADDRESS, {}]]),
    } as unknown as Awaited<ReturnType<typeof createExistingTx>>)
    setSafeOwners([SIGNER_ADDRESS])
  })

  it('enables Confirm for an owner who submitted the transaction', async () => {
    const { findByText } = renderModal()

    expect(await findByText('Confirm')).not.toBeDisabled()
  })

  it('enables Confirm for a non-owner who submitted the transaction', async () => {
    setSafeOwners([fakerChecksummedAddress(), fakerChecksummedAddress()])

    const { findByText, queryByLabelText } = renderModal()

    expect(await findByText('Confirm')).not.toBeDisabled()
    expect(queryByLabelText('Your connected wallet is not a signer of this Safe account')).not.toBeInTheDocument()
  })

  it('disables Confirm and explains why when connected to the wrong chain', async () => {
    mockUseIsWrongChain.mockReturnValue(true)

    const { findByText, getByText } = renderModal()

    expect(await findByText('Confirm')).toBeDisabled()
    expect(getByText('Change your wallet network')).toBeInTheDocument()
    expect(getByText(/trying to speed up a transaction/)).toBeInTheDocument()
  })

  it('shows no network warning when Confirm is enabled', async () => {
    const { findByText, queryByText } = renderModal()

    expect(await findByText('Confirm')).not.toBeDisabled()
    expect(queryByText('Change your wallet network')).not.toBeInTheDocument()
  })

  it('renders nothing when no wallet is connected', async () => {
    mockUseWallet.mockReturnValue(null)

    const { queryByTestId } = renderModal()
    await waitFor(() => expect(mockCreateExistingTx).toHaveBeenCalled())

    expect(queryByTestId('speedup-summary')).not.toBeInTheDocument()
  })

  it('renders nothing when the connected wallet did not submit the transaction', async () => {
    mockUseWallet.mockReturnValue({
      address: fakerChecksummedAddress(),
      provider: {},
    } as unknown as ConnectedWallet)

    const { queryByTestId } = renderModal()
    await waitFor(() => expect(mockCreateExistingTx).toHaveBeenCalled())

    expect(queryByTestId('speedup-summary')).not.toBeInTheDocument()
  })
})
