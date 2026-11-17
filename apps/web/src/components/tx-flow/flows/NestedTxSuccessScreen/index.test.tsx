import { render } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { zeroPadValue } from 'ethers'
import NestedTxSuccessScreen from '.'
import { PendingStatus, type PendingTxsState } from '@/store/pendingTxsSlice'
import * as useChainsHook from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'

jest.mock('@/components/tx-flow/safe-scope/SafeScopeProvider', () => ({
  SafeScopeProvider: ({
    initial,
    children,
  }: {
    initial?: { chainId: string; safeAddress: string }
    children: React.ReactNode
  }) => (
    <div data-testid="success-scope" data-chain={initial?.chainId} data-safe={initial?.safeAddress}>
      {children}
    </div>
  ),
}))

const chain = chainBuilder()
  .with({
    chainId: '1',
    blockExplorerUriTemplate: {
      address: 'https://etherscan.io/address/{{address}}',
      txHash: 'https://etherscan.io/tx/{{txHash}}',
      api: 'https://api.etherscan.io/api',
    },
  })
  .build()

const TX_ID = 'multisig_0xchild_0xhash'
const PARENT_SAFE = faker.finance.ethereumAddress()
const CHILD_SAFE = faker.finance.ethereumAddress()

const renderScreen = (
  executed: boolean,
  hash: string,
  method: 'approveHash' | 'execTransaction' = 'approveHash',
  scope?: { chainId: string; safeAddress: string },
) => {
  const pendingTxs: PendingTxsState = {
    [TX_ID]: {
      nonce: 1,
      chainId: '1',
      safeAddress: CHILD_SAFE,
      status: PendingStatus.NESTED_SIGNING,
      signerAddress: PARENT_SAFE,
      txHashOrParentSafeTxHash: hash,
      executed,
      method,
    },
  }
  return render(<NestedTxSuccessScreen txId={TX_ID} scope={scope} />, { initialReduxState: { pendingTxs } })
}

describe('NestedTxSuccessScreen', () => {
  beforeEach(() => {
    jest.spyOn(useChainsHook, 'useCurrentChain').mockReturnValue(chain)
  })

  it('links to the block explorer when the parent executed immediately', () => {
    const onChainTxHash = zeroPadValue('0x01', 32)
    const { getByText } = renderScreen(true, onChainTxHash)

    expect(getByText(/executed this transaction on-chain/i)).toBeInTheDocument()

    const link = getByText('Open the transaction').closest('a')
    expect(link).toHaveAttribute('href', `https://etherscan.io/tx/${onChainTxHash}`)
  })

  it('deep-links to the parent transaction detail when the parent only queued the tx', () => {
    const parentSafeTxHash = zeroPadValue('0x02', 32)
    const { getByText } = renderScreen(false, parentSafeTxHash)

    expect(getByText(/still need to confirm and execute/i)).toBeInTheDocument()

    const link = getByText('Open the transaction').closest('a')
    const href = link?.getAttribute('href') ?? ''
    expect(href).toContain('/transactions/tx')
    expect(href).toContain(`id=${encodeURIComponent(parentSafeTxHash)}`)
    expect(href).not.toContain('etherscan.io')
  })

  it('labels the step approveHash and uses "confirm" copy for a nested signature', () => {
    const { getByText } = renderScreen(false, zeroPadValue('0x03', 32), 'approveHash')

    expect(getByText('approveHash')).toBeInTheDocument()
    expect(getByText(/before it signs this Safe/i)).toBeInTheDocument()
  })

  it('labels the step execTransaction and uses "execute" copy for a nested execution', () => {
    const { getByText } = renderScreen(false, zeroPadValue('0x04', 32), 'execTransaction')

    expect(getByText('execTransaction')).toBeInTheDocument()
    expect(getByText(/before this Safe's transaction runs/i)).toBeInTheDocument()
  })

  it("re-mounts the selected Safe's scope when a Space-level flow opened it", () => {
    const { getByTestId } = renderScreen(false, zeroPadValue('0x05', 32), 'approveHash', {
      chainId: '1',
      safeAddress: CHILD_SAFE,
    })

    const scope = getByTestId('success-scope')
    expect(scope).toHaveAttribute('data-chain', '1')
    expect(scope).toHaveAttribute('data-safe', CHILD_SAFE)
    expect(scope.querySelector('[data-testid="transaction-status"]')).toBeInTheDocument()
  })

  it('mounts no scope for a Safe-level flow', () => {
    const { queryByTestId } = renderScreen(false, zeroPadValue('0x06', 32))

    expect(queryByTestId('success-scope')).not.toBeInTheDocument()
  })

  it('shows an error when there is no nested pending tx', () => {
    const { getByText } = render(<NestedTxSuccessScreen txId="unknown" />, { initialReduxState: { pendingTxs: {} } })
    expect(getByText('No transaction data found')).toBeInTheDocument()
  })
})
