import { http, HttpResponse } from 'msw'
import { EthSafeSignature, EthSafeTransaction } from '@safe-global/protocol-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { server } from '@/src/tests/server'
import { GATEWAY_URL } from '@/src/config/constants'
import { createTestStore } from '@/src/tests/test-utils'
import proposeNewTransaction from './proposeNewTransaction'
import { generateDeclaredAttribution } from '@/src/tests/factories/declaredAttribution'
import {
  generateAddress,
  generateSafeTxHash,
  generateTransactionSignature,
  generateTxId,
} from '@/src/tests/factories/transaction'

const CHAIN_ID = '1'
const SAFE_ADDRESS = generateAddress()

const buildSignedTx = (): EthSafeTransaction => {
  const safeTx = new EthSafeTransaction({
    to: generateAddress(),
    value: '0',
    data: '0x',
    nonce: 1,
    operation: 0,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: ZERO_ADDRESS,
    refundReceiver: ZERO_ADDRESS,
  })
  safeTx.addSignature(new EthSafeSignature(generateAddress(), generateTransactionSignature()))
  return safeTx
}

const captureProposal = () => {
  const captured: { body?: Record<string, unknown> } = {}
  server.use(
    http.post(`${GATEWAY_URL}/v1/chains/${CHAIN_ID}/transactions/${SAFE_ADDRESS}/propose`, async ({ request }) => {
      captured.body = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({ txId: generateTxId() })
    }),
  )
  return captured
}

const propose = (declared: Parameters<typeof proposeNewTransaction>[0]['declared']) =>
  proposeNewTransaction({
    chainId: CHAIN_ID,
    safeAddress: SAFE_ADDRESS,
    sender: generateAddress(),
    signedTx: buildSignedTx(),
    safeTxHash: generateSafeTxHash(),
    dispatch: createTestStore().dispatch,
    declared,
  })

describe('proposeNewTransaction', () => {
  it('sends the declared attribution with the proposal', async () => {
    const captured = captureProposal()
    const declared = generateDeclaredAttribution()

    await propose(declared)

    expect(captured.body?.declared).toEqual(declared)
  })
})
