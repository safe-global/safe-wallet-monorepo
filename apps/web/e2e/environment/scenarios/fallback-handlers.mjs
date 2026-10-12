import { AbiCoder, Interface, MaxUint256 } from 'ethers'
import { openSafe, proposeTransaction } from './safe.mjs'
import { rebuildStagingSafes } from './staging-safes.mjs'
import { waitUntil } from './indexing.mjs'
import { addressOf } from './chain.mjs'
import { COMPOSABLE_COW, COW, DAI, VAULT_RELAYER } from './cow-protocol.mjs'

const cowFallbackHandler = '0x2f55e8b20D0B9FEFA187AA7d00B6Cbe563605bF5'
const cowDomainSeparator = '0xdaee378bd0eb30ddf479272accf91761e697bc00e067a268f95f1d2732ed230b'
const twapHandler = '0x6cF1e9cA41f7611dEf408122793c358a3d11E5a5'
const currentBlockFactory = '0x52eD56Da04309Aca4c3FECC595298d80C2f16BAc'
// The Safe address on staging, so the illegal-handler case keeps its staging handler.
const illegalHandler = '0xF184a243925Bf7fb1D64487339FF4F177Fb75644'
const officialHandler141 = '0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99'

const safeInterface = new Interface([
  'function setFallbackHandler(address)',
  'function setDomainVerifier(bytes32,address)',
])
const erc20 = new Interface(['function approve(address,uint256) returns (bool)'])
const composable = new Interface(['function createWithContext((address,bytes32,bytes),address,bytes,bool)'])

// Staging SEP_STATIC_SAFE_34's queued TWAP order: sell 300 COW in two parts, 182.5 days apart.
function twapOrderCalls(safe) {
  const staticInput = AbiCoder.defaultAbiCoder().encode(
    ['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
    [
      COW,
      DAI,
      safe,
      150000000000000000000n,
      441523756238896011930n,
      0,
      2,
      15768000,
      0,
      '0x90c4d11e20189648805e2886053933dbbcc7e354d6ba233d4edc939866d48a37',
    ],
  )
  const salt = '0x000000000000000000000000000000000000000000000000000000194b712d75'
  return [
    { to: safe, value: '0', data: safeInterface.encodeFunctionData('setFallbackHandler', [cowFallbackHandler]) },
    {
      to: safe,
      value: '0',
      data: safeInterface.encodeFunctionData('setDomainVerifier', [cowDomainSeparator, COMPOSABLE_COW]),
    },
    { to: COW, value: '0', data: erc20.encodeFunctionData('approve', [VAULT_RELAYER, MaxUint256]) },
    {
      to: COMPOSABLE_COW,
      value: '0',
      data: composable.encodeFunctionData('createWithContext', [
        [twapHandler, salt, staticInput],
        currentBlockFactory,
        '0x',
        true,
      ]),
    },
  ]
}

async function propose(env, owners, safe, transactions, nonce) {
  const context = await openSafe(env, owners.owner4, addressOf(safe))
  const transaction = await context.safe.createTransaction({ transactions, options: { nonce }, onlyCalls: true })
  const { hash, id } = await proposeTransaction(context, transaction)
  const transactionId = `multisig_${context.safeAddress}_${hash}`
  const details = `${env.SAFE_CGW_BASE_URL}/v1/chains/${context.chainId}/transactions/${transactionId}`
  await waitUntil(env, details, (detail) => detail.detailedExecutionInfo?.confirmations?.length === 1)
  return id
}

/** The staging Safes of the fallback handler spec and their queued transactions, all proposed by OWNER_4. */
export async function prepareFallbackHandlersScenario(env, owners) {
  const safes = await rebuildStagingSafes(env, owners, ['SEP_STATIC_SAFE_34', 'SEP_STATIC_SAFE_35'])
  const setHandler = (safe, handler) => [
    { to: safe, value: '0', data: safeInterface.encodeFunctionData('setFallbackHandler', [handler]) },
  ]
  const handlerSafe = addressOf(safes.SEP_STATIC_SAFE_35)
  const twapSafe = addressOf(safes.SEP_STATIC_SAFE_34)
  return {
    safes: { static: safes },
    fixtures: {
      'fallbackHandlers.illegalContract': await propose(
        env,
        owners,
        safes.SEP_STATIC_SAFE_35,
        setHandler(handlerSafe, illegalHandler),
        1,
      ),
      'fallbackHandlers.official141': await propose(
        env,
        owners,
        safes.SEP_STATIC_SAFE_35,
        setHandler(handlerSafe, officialHandler141),
        5,
      ),
      'swaps.sellTwapQLimitOrder': await propose(env, owners, safes.SEP_STATIC_SAFE_34, twapOrderCalls(twapSafe), 2),
    },
  }
}
