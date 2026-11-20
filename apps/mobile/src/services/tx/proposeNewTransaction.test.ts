import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import type { SafeTransaction } from '@safe-global/types-kit'
import { server } from '@/src/tests/server'
import { GATEWAY_URL } from '@/src/config/constants'
import { createTestStore } from '@/src/tests/test-utils'
import proposeNewTransaction from './proposeNewTransaction'
import { generateDeclaredAttribution } from '@/src/tests/factories/declaredAttribution'

const CHAIN_ID = '1'
const SAFE_ADDRESS = faker.finance.ethereumAddress()

const buildSignedTx = (): SafeTransaction =>
  ({
    signatures: new Map([['0x1', {}]]),
    encodedSignatures: () => '0xsignature',
    data: {
      to: faker.finance.ethereumAddress(),
      value: '0',
      data: '0x',
      nonce: 1,
      operation: 0,
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: faker.finance.ethereumAddress(),
      refundReceiver: faker.finance.ethereumAddress(),
    },
  }) as unknown as SafeTransaction

const captureProposal = () => {
  const captured: { body?: Record<string, unknown> } = {}
  server.use(
    http.post(`${GATEWAY_URL}/v1/chains/${CHAIN_ID}/transactions/${SAFE_ADDRESS}/propose`, async ({ request }) => {
      captured.body = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({ txId: faker.string.uuid() })
    }),
  )
  return captured
}

const propose = (declared: Parameters<typeof proposeNewTransaction>[0]['declared']) =>
  proposeNewTransaction({
    chainId: CHAIN_ID,
    safeAddress: SAFE_ADDRESS,
    sender: faker.finance.ethereumAddress(),
    signedTx: buildSignedTx(),
    safeTxHash: faker.string.hexadecimal({ length: 64 }),
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
