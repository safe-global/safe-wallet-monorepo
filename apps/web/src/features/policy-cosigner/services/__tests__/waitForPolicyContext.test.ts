import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { Interface, JsonRpcProvider, Wallet, ZeroAddress, getAddress } from 'ethers'
import { calculateSafeTransactionHash } from '@safe-global/protocol-kit'
import type { SafeTransactionData } from '@safe-global/types-kit'
import type { CosignatureDto } from '@safe-global/store/cosigner/cosignerApi.dto'
import { SAFE_POLICY_GUARD_BY_DELAY } from '@safe-global/utils/features/policy-guard/constants'
import { COSIGNER_POLICY_ABI, POLICY_GUARD_GET_POLICY_ABI } from '@safe-global/utils/features/policy-cosigner/constants'
import { makeStore, setStoreInstance } from '@/store'
import { initialState as settingsInitialState } from '@/store/settingsSlice'
import { server } from '@/tests/server'
import { CosignerExecutionError, waitForPolicyContext } from '../waitForPolicyContext'

const randomAddress = () => getAddress(faker.finance.ethereumAddress())
const randomWallet = () => new Wallet(faker.string.hexadecimal({ length: 64, casing: 'lower' }))

const COSIGNER_SERVICE_URL = 'https://cosigner.test'
const RPC_URL = 'https://rpc.test/'
const CHAIN_ID = '11155111'

const guardInterface = new Interface(POLICY_GUARD_GET_POLICY_ABI)
const cosignerInterface = new Interface(COSIGNER_POLICY_ABI)

const GUARD = SAFE_POLICY_GUARD_BY_DELAY['60s']
const COSIGNER_POLICY = randomAddress()
const OTHER_POLICY = randomAddress()

type JsonRpcRequest = { id: number; method: string; params: [{ to: string; data: string }] }

const answerRpc = (policy: string, cosigner: string) =>
  http.post(RPC_URL, async ({ request }) => {
    const body = (await request.json()) as JsonRpcRequest | JsonRpcRequest[]
    const answer = ({ id, method, params }: JsonRpcRequest) => {
      if (method === 'eth_chainId') return { jsonrpc: '2.0', id, result: '0xaa36a7' }
      const [{ to }] = params
      if (to.toLowerCase() === GUARD.toLowerCase()) {
        return { jsonrpc: '2.0', id, result: guardInterface.encodeFunctionResult('getPolicy', [1n, policy]) }
      }
      if (to.toLowerCase() === COSIGNER_POLICY.toLowerCase()) {
        return { jsonrpc: '2.0', id, result: cosignerInterface.encodeFunctionResult('getCoSigner', [cosigner]) }
      }
      return { jsonrpc: '2.0', id, error: { code: 3, message: 'execution reverted', data: '0x' } }
    }
    return HttpResponse.json(Array.isArray(body) ? body.map(answer) : answer(body))
  })

const answerCosigner = (...responses: CosignatureDto[][]) => {
  let call = 0
  return http.get(`${COSIGNER_SERVICE_URL}/v1/transactions/:safeTxHash`, ({ params }) => {
    const signatures = responses[Math.min(call++, responses.length - 1)]
    return HttpResponse.json({
      chainId: CHAIN_ID,
      safeAddress: SAFE_ADDRESS,
      safeTxHash: params.safeTxHash,
      signatures,
    })
  })
}

const SAFE_ADDRESS = randomAddress()

const buildTxData = (): SafeTransactionData => ({
  to: randomAddress(),
  value: faker.number.bigInt({ min: 1n, max: 10n ** 18n }).toString(),
  data: '0x',
  operation: 0,
  safeTxGas: '0',
  baseGas: '0',
  gasPrice: '0',
  gasToken: ZeroAddress,
  refundReceiver: ZeroAddress,
  nonce: faker.number.int({ min: 0, max: 100 }),
})

const buildSafe = (guard: string | undefined) => ({
  chainId: CHAIN_ID,
  address: { value: SAFE_ADDRESS },
  guard: guard ? { value: guard } : null,
  version: '1.5.0',
})

const pending = (): CosignatureDto => ({
  cosignerName: 'SAFE',
  status: 'PENDING',
  ruleId: null,
  reason: null,
  signature: null,
  decidedAt: null,
})

const signedBy = (cosigner: Wallet, txData: SafeTransactionData): CosignatureDto => {
  const safeTxHash = calculateSafeTransactionHash(SAFE_ADDRESS, txData, '1.5.0', BigInt(CHAIN_ID))
  return {
    ...pending(),
    status: 'SIGNED',
    signature: { signer: cosigner.address, data: cosigner.signingKey.sign(safeTxHash).serialized },
    decidedAt: faker.date.recent().toISOString(),
  }
}

describe('waitForPolicyContext', () => {
  const provider = new JsonRpcProvider(RPC_URL, Number(CHAIN_ID), { staticNetwork: true, batchMaxCount: 1 })

  beforeEach(() => {
    setStoreInstance(
      makeStore({
        settings: {
          ...settingsInitialState,
          env: { ...settingsInitialState.env, cosigner: { [CHAIN_ID]: COSIGNER_SERVICE_URL } },
        },
      }),
    )
  })

  afterAll(() => {
    provider.destroy()
  })

  it('needs no context for a Safe without a policy guard', async () => {
    const txData = buildTxData()

    const context = await waitForPolicyContext(buildSafe(undefined), txData, provider)

    expect(context).toBeUndefined()
  })

  it('needs no context on a chain without a co-signer service URL', async () => {
    setStoreInstance(makeStore({}))

    const context = await waitForPolicyContext(buildSafe(GUARD), buildTxData(), provider)

    expect(context).toBeUndefined()
  })

  it('needs no context when the guard routes the tx to a policy other than the co-signer', async () => {
    server.use(answerRpc(OTHER_POLICY, ZeroAddress))

    const context = await waitForPolicyContext(buildSafe(GUARD), buildTxData(), provider)

    expect(context).toBeUndefined()
  })

  it('returns the co-signature once the co-signer has signed', async () => {
    const cosigner = randomWallet()
    const txData = buildTxData()
    server.use(answerRpc(COSIGNER_POLICY, cosigner.address), answerCosigner([pending()], [signedBy(cosigner, txData)]))

    const context = await waitForPolicyContext(buildSafe(GUARD), txData, provider, { intervalMs: 1 })

    expect(context).toBe(signedBy(cosigner, txData).signature?.data)
  })

  it('throws with the reason when the co-signer rejects the tx', async () => {
    const cosigner = randomWallet()
    server.use(
      answerRpc(COSIGNER_POLICY, cosigner.address),
      answerCosigner([{ ...pending(), status: 'REJECTED', reason: 'Recipient is not allowlisted' }]),
    )

    const result = waitForPolicyContext(buildSafe(GUARD), buildTxData(), provider)

    await expect(result).rejects.toThrow(CosignerExecutionError)
    await expect(result).rejects.toThrow('The co-signer rejected this transaction: Recipient is not allowlisted')
  })

  it('throws when the co-signer is still pending at the deadline', async () => {
    const cosigner = randomWallet()
    server.use(answerRpc(COSIGNER_POLICY, cosigner.address), answerCosigner([pending()]))

    const result = waitForPolicyContext(buildSafe(GUARD), buildTxData(), provider, { timeoutMs: 0 })

    await expect(result).rejects.toMatchObject({ state: { status: 'pending' } })
  })

  it('reports the service as unavailable when it answers with an HTML page instead of JSON', async () => {
    const cosigner = randomWallet()
    server.use(
      answerRpc(COSIGNER_POLICY, cosigner.address),
      http.get(`${COSIGNER_SERVICE_URL}/v1/transactions/:safeTxHash`, () => HttpResponse.html('<html></html>')),
    )

    const result = waitForPolicyContext(buildSafe(GUARD), buildTxData(), provider)

    await expect(result).rejects.toMatchObject({
      state: {
        status: 'unavailable',
        cosigner: cosigner.address,
        reason: expect.stringContaining("didn't answer with JSON"),
      },
    })
  })

  it('refuses a tx with gas parameters because the co-signature only covers zero gas fields', async () => {
    const cosigner = randomWallet()
    server.use(answerRpc(COSIGNER_POLICY, cosigner.address))

    const result = waitForPolicyContext(buildSafe(GUARD), { ...buildTxData(), safeTxGas: '50000' }, provider)

    await expect(result).rejects.toMatchObject({ state: { status: 'gasNotZero' } })
  })
})
