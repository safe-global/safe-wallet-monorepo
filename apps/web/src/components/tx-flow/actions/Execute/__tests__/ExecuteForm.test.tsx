import type { Relay } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { createMockSafeTransaction } from '@/tests/transactions'
import { OperationType } from '@safe-global/types-kit'
import { type ReactElement } from 'react'
import { ExecuteForm } from '../ExecuteForm'
import { RelaySimulationError } from '@safe-global/utils/services/relayErrors'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import * as useGasLimit from '@/hooks/useGasLimit'
import * as useIsValidExecution from '@/hooks/useIsValidExecution'
import * as useWalletCanRelay from '@/hooks/useWalletCanRelay'
import * as relayUtils from '@/utils/relaying'
import * as walletCanPay from '@/hooks/useWalletCanPay'
import * as useValidateTxData from '@/hooks/useValidateTxData'
import * as useRemainingRelays from '@/hooks/useRemainingRelays'
import * as useChains from '@/hooks/useChains'
import * as useWallet from '@/hooks/wallets/useWallet'
import * as walletUtils from '@/utils/wallets'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import { EthSafeTransaction, generatePreValidatedSignature } from '@safe-global/protocol-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { chainBuilder } from '@/tests/builders/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { render } from '@/tests/test-utils'
import { act, fireEvent, waitFor } from '@testing-library/react'
import type {
  RecipientAnalysisResults,
  ContractAnalysisResults,
  DeadlockAnalysisResults,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'

// We assume that CheckWallet always returns true
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default({ children }: { children: (ok: boolean) => ReactElement }) {
    return children(true)
  },
}))

describe('ExecuteForm', () => {
  const safeTransaction = createMockSafeTransaction({
    to: '0x1',
    data: '0x',
    operation: OperationType.Call,
  })

  const defaultProps = {
    onSubmit: jest.fn(),
    isOwner: true,
    txId: '0x123123',
    isExecutionLoop: false,
    relays: [undefined, undefined, false] as AsyncResult<Relay>,
    txActions: {
      proposeTx: jest.fn(),
      signTx: jest.fn(),
      addToBatch: jest.fn(),
      executeTx: jest.fn(),
      signProposerTx: jest.fn(),
    },
    txSecurity: {
      setRecipientAddresses: jest.fn(),
      setPoisoningAddresses: jest.fn(),
      setSafeTx: jest.fn(),
      recipient: [undefined, undefined, false] as AsyncResult<RecipientAnalysisResults>,
      contract: [undefined, undefined, false] as AsyncResult<ContractAnalysisResults>,
      threat: [undefined, undefined, false] as AsyncResult<ThreatAnalysisResults>,
      deadlock: [undefined, undefined, false] as AsyncResult<DeadlockAnalysisResults>,
      nestedThreat: [undefined, undefined, false] as AsyncResult<ThreatAnalysisResults>,
      isNested: false,
      needsRiskConfirmation: false,
      isRiskConfirmed: false,
      setIsRiskConfirmed: jest.fn(),
      safeAnalysis: null,
      addToTrustedList: jest.fn(),
    },
    options: [
      { id: 'execute', label: 'Execute' },
      { id: 'sign', label: 'Sign' },
    ],
    onChange: jest.fn(),
    slotId: 'execute',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(useValidateTxData, 'useValidateTxData').mockReturnValue([undefined, undefined, false])
  })

  it('shows estimated fees', () => {
    const { getByText } = render(<ExecuteForm {...defaultProps} />)

    expect(getByText('Estimated fee')).toBeInTheDocument()
  })

  it('shows a non-owner error if the transaction still needs signatures and its not an owner', () => {
    const { getByText } = render(<ExecuteForm {...defaultProps} isOwner={false} onlyExecute={false} />)

    expect(
      getByText("You are currently not a signer of this Safe account and won't be able to submit this transaction."),
    ).toBeInTheDocument()
  })

  it('does not show a non-owner error if the transaction is fully signed and its not an owner', () => {
    const { queryByText } = render(<ExecuteForm {...defaultProps} isOwner={false} onlyExecute={true} />)

    expect(
      queryByText("You are currently not a signer of this Safe account and won't be able to submit this transaction."),
    ).not.toBeInTheDocument()
  })

  it('shows an error if the same safe tries to execute', () => {
    const { getByText } = render(<ExecuteForm {...defaultProps} isExecutionLoop={true} />)

    expect(
      getByText('Cannot execute a transaction from the Safe account itself, please connect a different account.'),
    ).toBeInTheDocument()
  })

  it('shows an error if the connected wallet has insufficient funds to execute and relaying is not selected', () => {
    jest.spyOn(walletCanPay, 'default').mockReturnValue(false)
    jest.spyOn(useWalletCanRelay, 'default').mockReturnValue([true, undefined, false])
    jest.spyOn(relayUtils, 'hasRemainingRelays').mockReturnValue(true)

    const { getByText, queryByText, getByTestId } = render(<ExecuteForm {...defaultProps} />)

    expect(
      queryByText("Your connected wallet doesn't have enough funds to execute this transaction."),
    ).not.toBeInTheDocument()

    const executeWithWalletOption = getByTestId('connected-wallet-execution-method')
    fireEvent.click(executeWithWalletOption)

    expect(
      getByText("Your connected wallet doesn't have enough funds to execute this transaction."),
    ).toBeInTheDocument()
  })

  it('shows a relaying option if relaying is enabled', () => {
    jest.spyOn(useWalletCanRelay, 'default').mockReturnValue([true, undefined, false])
    jest.spyOn(relayUtils, 'hasRemainingRelays').mockReturnValue(true)

    const { getByText } = render(<ExecuteForm {...defaultProps} />)

    expect(getByText('Who will pay gas fees:')).toBeInTheDocument()
  })

  const nestedApproveHashTx = () =>
    createMockSafeTransaction({
      to: '0x0000000000000000000000000000000000000C11', // child Safe address
      data: Safe__factory.createInterface().encodeFunctionData('approveHash', [
        '0x' + 'ab'.repeat(32), // child safeTxHash
      ]),
      operation: OperationType.Call,
    })

  describe('nested approveHash relay quota', () => {
    // `useHasFeature` calls the module-local `useCurrentChain`, so spying on that export alone does
    // not reach it — it needs its own mock, restored so it doesn't leak into the other tests.
    let hasFeatureSpy: jest.SpyInstance

    const mockChainFeature = (feature: FEATURES) => {
      jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(
        chainBuilder()
          .with({ features: [feature] })
          .build(),
      )
      hasFeatureSpy = jest.spyOn(useChains, 'useHasFeature').mockImplementation((f) => f === feature)
    }

    beforeEach(() => {
      jest.spyOn(useWalletCanRelay, 'default').mockReturnValue([true, undefined, false])
      jest.spyOn(relayUtils, 'hasRemainingRelays').mockReturnValue(true)
      jest.spyOn(useRemainingRelays, 'useRelaysBySafe').mockReturnValue([{ remaining: 3, limit: 5 }, undefined, false])
    })

    afterEach(() => {
      hasFeatureSpy?.mockRestore()
    })

    // Regression: a nested approveHash on a daily-limit relay chain (RELAYING, no GTF) still draws from the
    // daily quota, so the "free transactions left today" counter must be shown. Previously the call site
    // forced relays=undefined for every nested approveHash, suppressing the counter on daily-limit chains too.
    it('shows the remaining-relays counter on a daily-limit chain', () => {
      // Daily-limit chain: relaying is available but it is NOT the sponsored/unlimited GTF relay.
      mockChainFeature(FEATURES.RELAYING)

      const { getByText } = render(<ExecuteForm {...defaultProps} safeTx={nestedApproveHashTx()} />)

      expect(getByText(/free transactions left today/)).toBeInTheDocument()
    })

    // A nested approveHash on a GTF (sponsored/unlimited) chain has no daily quota, so the counter stays hidden.
    it('does not show the remaining-relays counter on a GTF chain', () => {
      mockChainFeature(FEATURES.GTF)

      const { queryByText } = render(<ExecuteForm {...defaultProps} safeTx={nestedApproveHashTx()} />)

      expect(queryByText(/free transactions left today/)).not.toBeInTheDocument()
    })
  })

  it('shows an execution validation error', () => {
    jest
      .spyOn(useIsValidExecution, 'default')
      .mockReturnValue({ executionValidationError: new Error('Some error'), isValidExecutionLoading: false })

    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        txActions={{
          proposeTx: jest.fn(),
          signTx: jest.fn(),
          addToBatch: jest.fn(),
          executeTx: jest.fn(),
          signProposerTx: jest.fn(),
        }}
      />,
    )

    expect(getByText(/Could not check this transaction/)).toBeInTheDocument()
  })

  it('shows a gasLimit error', () => {
    jest
      .spyOn(useGasLimit, 'default')
      .mockReturnValue({ gasLimitError: new Error('Gas limit error'), gasLimitLoading: false })

    const { getByText } = render(<ExecuteForm {...defaultProps} />)

    expect(getByText(/Could not check this transaction/)).toBeInTheDocument()
  })

  it('execute the tx when the submit button is clicked', async () => {
    const mockExecuteTx = jest.fn()

    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txActions={{
          proposeTx: jest.fn(),
          signTx: jest.fn(),
          addToBatch: jest.fn(),
          executeTx: mockExecuteTx,
          signProposerTx: jest.fn(),
        }}
      />,
    )

    const button = getByText('Execute')

    fireEvent.click(button)

    await waitFor(() => {
      expect(mockExecuteTx).toHaveBeenCalled()
    })
  })

  it('shows a disabled submit button if there is no safeTx', () => {
    const { getByText } = render(<ExecuteForm {...defaultProps} safeTx={undefined} />)

    const button = getByText('Execute')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows a disabled submit button if passed via props', () => {
    const { getByText } = render(<ExecuteForm safeTx={safeTransaction} disableSubmit {...defaultProps} />)

    const button = getByText('Execute')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows a disabled submit button if the same safe is connected', () => {
    const { getByText } = render(<ExecuteForm {...defaultProps} isExecutionLoop={true} />)

    const button = getByText('Execute')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows a disabled submit button if there is a high or critical risk and user has not confirmed it', () => {
    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txSecurity={{ ...defaultProps.txSecurity, isRiskConfirmed: false, needsRiskConfirmation: true }}
      />,
    )

    const button = getByText('Execute')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows an enabled submit button if there is a high or critical risk and user has confirmed it', () => {
    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txSecurity={{ ...defaultProps.txSecurity, isRiskConfirmed: true, needsRiskConfirmation: true }}
      />,
    )

    const button = getByText('Execute')

    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('blocks execution and shows the simulation-failed banner on SIMULATION_FAILED', async () => {
    const mockExecuteTx = jest.fn().mockRejectedValue(new RelaySimulationError('SIMULATION_FAILED', 'expected revert'))

    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txActions={{ ...defaultProps.txActions, executeTx: mockExecuteTx }}
      />,
    )

    fireEvent.click(getByText('Execute'))

    await waitFor(() => {
      expect(getByText(/expected to fail on-chain/i)).toBeInTheDocument()
    })
    // The doomed tx can no longer be submitted.
    expect(getByText('Execute')).toBeDisabled()
  })

  it('offers an "Execute anyway" retry with acceptUnverifiedSimulation on INDETERMINATE_SIMULATION', async () => {
    const mockExecuteTx = jest
      .fn()
      .mockRejectedValueOnce(new RelaySimulationError('INDETERMINATE_SIMULATION', 'service down'))
      .mockResolvedValueOnce('0xnewtx')

    const { getByText, getByTestId } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txActions={{ ...defaultProps.txActions, executeTx: mockExecuteTx }}
      />,
    )

    fireEvent.click(getByText('Execute'))

    await waitFor(() => {
      expect(getByText(/couldn't review this transaction/i)).toBeInTheDocument()
    })

    // First attempt didn't opt into the unverified relay.
    expect(mockExecuteTx).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      undefined,
      expect.anything(),
      false,
    )

    fireEvent.click(getByTestId('relay-accept-unverified-btn'))

    await waitFor(() => {
      // Retry forwards acceptUnverifiedSimulation = true.
      expect(mockExecuteTx).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        undefined,
        expect.anything(),
        true,
      )
    })
  })

  describe('Safe-paid execution from a smart account signer', () => {
    const SAFE_THRESHOLD = 2

    // Non-zero gasPrice + baseGas + refundReceiver are what make the payload trigger
    // `Safe.handlePayment()`, i.e. a Safe-paid tx that must be relayed.
    const safePaidTx = (signatureCount = 0) => {
      const tx = new EthSafeTransaction({
        to: '0x0000000000000000000000000000000000000001',
        data: '0x',
        operation: OperationType.Call,
        value: '0',
        baseGas: '21000',
        gasPrice: '1000000000',
        gasToken: ZERO_ADDRESS,
        nonce: 0,
        refundReceiver: '0x0000000000000000000000000000000000000Fee',
        safeTxGas: '0',
      })

      Array.from({ length: signatureCount }, (_, i) =>
        tx.addSignature(generatePreValidatedSignature(`0x${(i + 1).toString().padStart(40, '0')}`)),
      )

      return tx
    }

    const mockSigner = (address: string) =>
      jest.spyOn(useWallet, 'useSigner').mockReturnValue({ address, chainId: '1', provider: null })

    // `useHasFeature` calls the module-local `useCurrentChain`, so it needs its own mock.
    const mockChainFeature = (feature: FEATURES) => {
      jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(
        chainBuilder()
          .with({ features: [feature] })
          .build(),
      )
      jest.spyOn(useChains, 'useHasFeature').mockImplementation((f) => f === feature)
    }

    beforeEach(() => {
      const safeAddress = '0x0000000000000000000000000000000000000C11'
      jest.spyOn(useSafeInfo, 'default').mockReturnValue({
        safeAddress,
        safe: extendedSafeInfoBuilder()
          .with({ address: { value: safeAddress }, threshold: SAFE_THRESHOLD })
          .build(),
        safeLoaded: true,
        safeLoading: false,
      })
      // Safe-paid fees are a GTF (RELAY_FEE) feature; the daily-limit cases mock their own chain.
      mockChainFeature(FEATURES.GTF)
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    // Regression: a parent Safe connected via WalletConnect carries no `isSafe` marker (that is only
    // set for the in-app nested signer), so this used to fall through to the generic Gelato error.
    it('shows the smart account executor error for a WalletConnect-connected Safe', async () => {
      mockSigner('0x0000000000000000000000000000000000000A11')
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(true)
      jest.spyOn(useWalletCanRelay, 'default').mockReturnValue([false, undefined, false])

      const { findByText, queryByText, getByText } = render(<ExecuteForm {...defaultProps} safeTx={safePaidTx()} />)

      expect(await findByText(/pay gas from this Safe account/)).toBeInTheDocument()
      expect(queryByText(/require Gelato relay/)).not.toBeInTheDocument()
      expect(getByText('Execute')).toBeDisabled()
    })

    it('shows the smart account executor error for the in-app nested signer', async () => {
      jest.spyOn(useWallet, 'useSigner').mockReturnValue({
        address: '0x0000000000000000000000000000000000000A11',
        chainId: '1',
        provider: null,
        isSafe: true,
      })
      jest.spyOn(useWalletCanRelay, 'default').mockReturnValue([false, undefined, false])

      const { findByText } = render(<ExecuteForm {...defaultProps} safeTx={safePaidTx()} />)

      expect(await findByText(/pay gas from this Safe account/)).toBeInTheDocument()
    })

    it('still shows the relay-unavailable error for an EOA signer', async () => {
      mockSigner('0x0000000000000000000000000000000000000E0A')
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)
      jest.spyOn(useWalletCanRelay, 'default').mockReturnValue([false, undefined, false])

      const { findByText, queryByText } = render(<ExecuteForm {...defaultProps} safeTx={safePaidTx()} />)

      expect(await findByText(/require Gelato relay/)).toBeInTheDocument()
      expect(queryByText(/pay gas from this Safe account/)).not.toBeInTheDocument()
    })

    it('does not block a relayable Safe-paid tx from an EOA signer', async () => {
      mockSigner('0x0000000000000000000000000000000000000E0A')
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)
      jest.spyOn(useWalletCanRelay, 'default').mockReturnValue([true, undefined, false])

      const { queryByText, getByText } = render(<ExecuteForm {...defaultProps} safeTx={safePaidTx()} />)

      await waitFor(() => {
        expect(getByText('Execute')).not.toBeDisabled()
      })
      expect(queryByText(/require Gelato relay/)).not.toBeInTheDocument()
      expect(queryByText(/pay gas from this Safe account/)).not.toBeInTheDocument()
    })

    it('relays a fully signed Safe-paid tx for a WalletConnect-connected Safe', async () => {
      mockSigner('0x0000000000000000000000000000000000000A11')
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(true)
      jest.spyOn(useWalletCanRelay, 'default').mockReturnValue([true, undefined, false])
      const mockExecuteTx = jest.fn().mockResolvedValue('0xexecuted')

      const { queryByText, getByText } = render(
        <ExecuteForm
          {...defaultProps}
          safeTx={safePaidTx(SAFE_THRESHOLD)}
          txActions={{ ...defaultProps.txActions, executeTx: mockExecuteTx }}
        />,
      )

      await waitFor(() => {
        expect(getByText('Execute')).not.toBeDisabled()
      })
      expect(queryByText(/pay gas from this Safe account/)).not.toBeInTheDocument()
      expect(queryByText(/require Gelato relay/)).not.toBeInTheDocument()

      fireEvent.click(getByText('Execute'))

      // Executed through the relay (`isRelayed` = true), not the connected wallet.
      await waitFor(() => {
        expect(mockExecuteTx).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.anything(),
          undefined,
          true,
          false,
        )
      })
    })

    // Branch scope: the split sign/execute behavior must stay on RELAY_FEE (GTF) chains. On a
    // daily-limit relay chain a parent approveHash is an ordinary relayable tx, so it must not be
    // forced onto the Safe-paid path nor blocked for a smart account executor.
    it('does not treat a nested approveHash as Safe-paid on a daily-limit chain', async () => {
      mockChainFeature(FEATURES.RELAYING)
      mockSigner('0x0000000000000000000000000000000000000A11')
      const isSmartAccountCheck = jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(true)
      jest.spyOn(useWalletCanRelay, 'default').mockReturnValue([true, undefined, false])
      jest.spyOn(relayUtils, 'hasRemainingRelays').mockReturnValue(true)

      const { queryByText, getByText } = render(<ExecuteForm {...defaultProps} safeTx={nestedApproveHashTx()} />)

      // Let the async smart-account check settle, so a block would have rendered by now if it applied.
      await waitFor(() => expect(isSmartAccountCheck).toHaveBeenCalled())
      await act(async () => {})

      expect(queryByText(/pay gas from this Safe account/)).not.toBeInTheDocument()
      expect(queryByText(/require Gelato relay/)).not.toBeInTheDocument()
      expect(getByText('Execute')).not.toBeDisabled()
    })

    // The fully-signed relaxation is GTF-only: on a daily-limit chain a Safe-paid payload keeps the
    // pre-branch behavior of blocking a smart account executor outright.
    it('keeps blocking a fully signed Safe-paid tx on a daily-limit chain', async () => {
      mockChainFeature(FEATURES.RELAYING)
      mockSigner('0x0000000000000000000000000000000000000A11')
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(true)
      jest.spyOn(useWalletCanRelay, 'default').mockReturnValue([true, undefined, false])

      const { findByText, getByText } = render(<ExecuteForm {...defaultProps} safeTx={safePaidTx(SAFE_THRESHOLD)} />)

      expect(await findByText(/pay gas from this Safe account/)).toBeInTheDocument()
      expect(getByText('Execute')).toBeDisabled()
    })
  })
})
