import { useContext } from 'react'
import { render } from '@/tests/test-utils'
import TxFlowProvider, { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { SafeShieldProvider } from '@/features/safe-shield/SafeShieldContext'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { createSafeTx } from '@/tests/builders/safeTx'
import * as wallet from '@/hooks/wallets/useWallet'
import * as chainHooks from '@/hooks/useChains'
import * as sharedHooks from '@/components/tx/shared/hooks'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { type NestedWallet } from '@/utils/nested-safe-wallet'
import * as useRecipientAnalysis from '@/features/safe-shield/hooks/useRecipientAnalysis'

const CanExecuteProbe = () => {
  const { canExecute } = useContext(TxFlowContext)
  return <div data-testid="can-execute">{String(canExecute)}</div>
}

describe('TxFlowProvider — nested signer execution gating', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useRecipientAnalysis, 'useRecipientAnalysis').mockReturnValue([undefined, undefined, false])
    // Immediately-executable child tx with a valid nonce → would normally enable Execute
    jest.spyOn(sharedHooks, 'useImmediatelyExecutable').mockReturnValue(true)
    jest.spyOn(sharedHooks, 'useValidateNonce').mockReturnValue(true)
  })

  const renderWithSigner = (isSafe: boolean, enabledFeatures: FEATURES[]) => {
    jest.spyOn(wallet, 'useSigner').mockReturnValue({
      chainId: '1',
      address: '0x1234567890000000000000000000000000000000',
      isSafe,
    } as unknown as NestedWallet)
    jest.spyOn(chainHooks, 'useHasFeature').mockImplementation((feature) => enabledFeatures.includes(feature))

    return render(
      <SafeShieldProvider>
        <SafeTxContext.Provider value={{ safeTx: createSafeTx() } as never}>
          <TxFlowProvider step={0} data={{}} prevStep={() => {}} nextStep={jest.fn()}>
            <CanExecuteProbe />
          </TxFlowProvider>
        </SafeTxContext.Provider>
      </SafeShieldProvider>,
    )
  }

  it('disables execution for a nested signer on a GTF chain (split signing & execution)', () => {
    const { getByTestId } = renderWithSigner(true, [FEATURES.GTF])
    expect(getByTestId('can-execute')).toHaveTextContent('false')
  })

  it.each([
    ['a RELAYING-only chain (split is GTF-only)', [FEATURES.RELAYING]],
    ['a chain without GTF or relaying', [] as FEATURES[]],
  ])('allows execution for a nested signer on %s (legacy EOA-execution flow)', (_label, features) => {
    const { getByTestId } = renderWithSigner(true, features)
    expect(getByTestId('can-execute')).toHaveTextContent('true')
  })

  it('allows execution for a regular (non-nested) signer on a GTF chain', () => {
    const { getByTestId } = renderWithSigner(false, [FEATURES.GTF])
    expect(getByTestId('can-execute')).toHaveTextContent('true')
  })
})
