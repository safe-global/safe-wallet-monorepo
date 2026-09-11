import { render, waitFor } from '@/tests/test-utils'
import { SafeScopeContext } from '@/components/tx-flow/safe-scope/context'
import { TxFlowContext, initialContext as txFlowInitialContext } from '@/components/tx-flow/TxFlowProvider'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import * as txSender from '@/services/tx/tx-sender'
import ConfirmProposedTx from '../ConfirmProposedTx'

jest.mock('@/services/tx/tx-sender', () => ({
  ...jest.requireActual('@/services/tx/tx-sender'),
  createExistingTx: jest.fn().mockResolvedValue(undefined),
}))

const scopeChainId = '137'
const urlSafe = 'sep:0x0000000000000000000000000000000000000123'
const txId = 'multisig_0x0000000000000000000000000000000000000456_0xabc'

describe('ConfirmProposedTx under a SafeScope', () => {
  it('loads the existing transaction on the scope chain, not the URL chain', async () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/spaces/policies', search: `?safe=${urlSafe}` },
    })

    render(
      <SafeScopeContext.Provider
        value={{
          scope: {
            chainId: scopeChainId,
            safeAddress: '0x0000000000000000000000000000000000000456',
            scopeKey: `${scopeChainId}:0x0000000000000000000000000000000000000456`,
            safeLoaded: false,
            safeLoading: true,
          },
          setScope: jest.fn(),
          clearScope: jest.fn(),
        }}
      >
        <TxFlowContext.Provider value={{ ...txFlowInitialContext, txId }}>
          <SafeTxContext.Provider
            value={{ setSafeTx: jest.fn(), setSafeTxError: jest.fn(), setNonce: jest.fn() } as never}
          >
            <ConfirmProposedTx onSubmit={jest.fn()} />
          </SafeTxContext.Provider>
        </TxFlowContext.Provider>
      </SafeScopeContext.Provider>,
    )

    await waitFor(() =>
      expect(txSender.createExistingTx).toHaveBeenCalledWith(
        scopeChainId,
        txId,
        undefined,
        expect.objectContaining({ chainId: scopeChainId }),
      ),
    )
  })
})
