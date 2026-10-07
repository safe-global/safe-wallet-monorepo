import { http, HttpResponse, type RequestHandler } from 'msw'
import { AbiCoder, SigningKey, concat, getBytes, keccak256, toBeHex, toUtf8Bytes } from 'ethers'
import { createMockChain } from '@safe-global/test'
import {
  SAFENET_CONSENSUS_ADDRESS,
  SAFENET_COORDINATOR_ADDRESS,
  SAFENET_ORACLE_ADDRESSES,
} from '@safe-global/utils/features/safenet-checks'
import {
  EMPTY_ORACLE_DATA_HASH,
  buildCommittedLog,
  buildNewRequestLog,
  buildOracleAttestedLog,
  buildOracleProposedLog,
  buildOracleResultLog,
  buildRevealedLog,
} from '@safe-global/utils/features/safenet-checks/builders'
import { h2 } from '@safe-global/utils/features/safenet-checks/utils/frost'
import { transactionProposalHash } from '@safe-global/utils/features/safenet-checks/utils/proposalHash'
import type { RawLog } from '@safe-global/utils/features/safenet-checks/utils/decodeLogs'
import type { Hex } from '@safe-global/utils/features/safenet-checks'
import { createChainData, createChainsPageDataV2 } from '@/stories/mocks'

/** Story-only Gnosis Chain for the Safenet reader: real hooks and reader, mocked JSON-RPC. */

const RPC_URL = 'https://rpc.safe.global/100/'
const ORACLE = SAFENET_ORACLE_ADDRESSES[0]
/** Where the raw-log builders emit sentinel events from. */
const BUILDER_SENTINEL_ADDRESS = '0x00000000000000000000000000000000000000aa'
const EPOCH = 32_939n
const HEAD_BLOCK = 48_600_000
const BLOCK_TIME_SECONDS = 5
const HEAD_TIMESTAMP = Math.floor(Date.now() / 1000)
const SECP256K1_ORDER = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n

const toHex = (value: number): string => `0x${value.toString(16)}`

/** The block whose 5s slot holds `timestampMs` on the mocked chain. */
export const blockAt = (timestampMs: number): number =>
  HEAD_BLOCK - Math.ceil((HEAD_TIMESTAMP - timestampMs / 1000) / BLOCK_TIME_SECONDS)

const blockHeader = (number: number) => ({
  number: toHex(number),
  timestamp: toHex(HEAD_TIMESTAMP - (HEAD_BLOCK - number) * BLOCK_TIME_SECONDS),
  hash: keccak256(toBeHex(number, 32)),
  parentHash: keccak256(toBeHex(number - 1, 32)),
  nonce: '0x0000000000000000',
  difficulty: '0x0',
  gasLimit: '0x1c9c380',
  gasUsed: '0x0',
  miner: `0x${'00'.repeat(20)}`,
  extraData: '0x',
  baseFeePerGas: '0x7',
  transactions: [],
})

const point = (scalar: bigint) => {
  const key = toBeHex(scalar, 32)
  const uncompressed = SigningKey.computePublicKey(key)
  return {
    x: BigInt(`0x${uncompressed.slice(4, 68)}`),
    y: BigInt(`0x${uncompressed.slice(68)}`),
    compressed: SigningKey.computePublicKey(key, true),
  }
}

const scalar = (seed: string): bigint => (BigInt(keccak256(toUtf8Bytes(seed))) % (SECP256K1_ORDER - 1n)) + 1n

const GROUP_SECRET = scalar('safenet-story-group')
const GROUP_KEY = point(GROUP_SECRET)

/** Story-only key: a FROST group signature (`z = k + c·x`) the real verifier accepts. */
const signAttestation = (message: Hex) => {
  const nonce = scalar(`safenet-story-nonce:${message}`)
  const commitment = point(nonce)
  const challenge = h2(getBytes(concat([commitment.compressed, GROUP_KEY.compressed, message])))
  return {
    r: { x: commitment.x, y: commitment.y },
    z: (nonce + ((challenge * GROUP_SECRET) % SECP256K1_ORDER)) % SECP256K1_ORDER,
  }
}

type CheckSpec = { safeTxHash: string; safe: string; chainId: string; timestampMs: number }

/** `null` approves; a string is the R-4.x code the sentinel cited. */
export type Vote = string | null

const sentinel = (index: number) => `0x${String(index + 1).padStart(40, '0')}`

const requestIdOf = (safeTxHash: string): Hex =>
  transactionProposalHash({
    chainId: '100',
    consensus: SAFENET_CONSENSUS_ADDRESS,
    epoch: EPOCH.toString(),
    oracle: ORACLE,
    oracleDataHash: EMPTY_ORACLE_DATA_HASH as Hex,
    safeTxHash: safeTxHash as Hex,
  })

const proposed = ({ safeTxHash, safe, chainId, timestampMs }: CheckSpec) =>
  buildOracleProposedLog(
    { safeTxHash, safe, chainId: BigInt(chainId), epoch: EPOCH, oracle: ORACLE },
    { blockNumber: blockAt(timestampMs) },
  )

const request = (spec: CheckSpec, deadlineBlock: number) => {
  const start = blockAt(spec.timestampMs) + 2
  return buildNewRequestLog(
    {
      requestId: requestIdOf(spec.safeTxHash),
      commitDeadline: BigInt(deadlineBlock - 12),
      revealDeadline: BigInt(deadlineBlock),
    },
    { blockNumber: start },
  )
}

const reveals = (spec: CheckSpec, votes: Vote[]) =>
  votes.map((reason, index) =>
    buildRevealedLog(
      {
        requestId: requestIdOf(spec.safeTxHash),
        sentinel: sentinel(index),
        approved: reason === null,
        reason: reason ?? '',
      },
      { blockNumber: blockAt(spec.timestampMs) + 20 + index },
    ),
  )

export const safenetCheck = {
  submitted: (spec: CheckSpec): RawLog[] => [proposed(spec)],

  /** The request opened halfway to its reveal deadline, so progress reads 50%. */
  inProgress: (spec: CheckSpec): RawLog[] => {
    const requestId = requestIdOf(spec.safeTxHash)
    return [
      proposed(spec),
      buildNewRequestLog(
        { requestId, commitDeadline: BigInt(HEAD_BLOCK + 12), revealDeadline: BigInt(HEAD_BLOCK + 24) },
        { blockNumber: HEAD_BLOCK - 24 },
      ),
      buildCommittedLog({ requestId, sentinel: sentinel(0) }, { blockNumber: HEAD_BLOCK - 10 }),
      buildCommittedLog({ requestId, sentinel: sentinel(1) }, { blockNumber: HEAD_BLOCK - 8 }),
    ]
  },

  benign: (spec: CheckSpec): RawLog[] => {
    const requestId = requestIdOf(spec.safeTxHash)
    const settled = blockAt(spec.timestampMs) + 30
    return [
      proposed(spec),
      request(spec, settled + 10),
      ...reveals(spec, [null, null, null]),
      buildOracleResultLog({ requestId, approved: true }, { blockNumber: settled }),
      buildOracleAttestedLog(
        {
          safeTxHash: spec.safeTxHash,
          safe: spec.safe,
          chainId: BigInt(spec.chainId),
          epoch: EPOCH,
          oracle: ORACLE,
          ...signAttestation(requestId),
        },
        { blockNumber: settled + 1 },
      ),
    ]
  },

  malicious: (spec: CheckSpec, votes: Vote[]): RawLog[] => {
    const settled = blockAt(spec.timestampMs) + 30
    return [
      proposed(spec),
      request(spec, settled + 10),
      ...reveals(spec, votes),
      buildOracleResultLog({ requestId: requestIdOf(spec.safeTxHash), approved: false }, { blockNumber: settled }),
    ]
  },

  /** Votes in, no result, and the reveal deadline already behind the head. */
  timedOut: (spec: CheckSpec, votes: Vote[]): RawLog[] => [
    proposed(spec),
    request(spec, blockAt(spec.timestampMs) + 30),
    ...reveals(spec, votes),
  ],
}

/** The `/v2/chains` page with the Safe's chain flagged and Gnosis Chain added for the reader. */
export const safenetChainsPage = () => {
  const chains = createChainsPageDataV2(createChainData({ safenetChecks: true }))
  const gnosis = createMockChain({ chainId: '100', chainName: 'Gnosis Chain', rpcUri: RPC_URL })
  return { ...chains, results: [...chains.results, gnosis] }
}

export const safenetChainsHandler = (): RequestHandler => {
  const page = safenetChainsPage()
  return http.get(/\/v2\/chains$/, () => HttpResponse.json(page))
}

type RpcRequest = { id: number; method: string; params: unknown[] }
type LogFilter = { address: string; topics: Array<string | string[] | null>; fromBlock: string; toBlock: string }

const asList = (topic: string | string[] | null | undefined): string[] =>
  topic == null ? [] : (Array.isArray(topic) ? topic : [topic]).map((value) => value.toLowerCase())

const abi = AbiCoder.defaultAbiCoder()

/** Gnosis Chain JSON-RPC: head and headers on a 5s grid, filtered `eth_getLogs`, the FROST group key. */
export const safenetRpcHandler = (logs: RawLog[]): RequestHandler => {
  const consensus = SAFENET_CONSENSUS_ADDRESS.toLowerCase()
  const consensusLogs = logs.filter((log) => log.address?.toLowerCase() !== BUILDER_SENTINEL_ADDRESS)
  const sentinelLogs = logs.filter((log) => !consensusLogs.includes(log))

  const getLogs = ({ address, topics, fromBlock, toBlock }: LogFilter) => {
    const from = Number(BigInt(fromBlock))
    const to = Number(BigInt(toBlock))
    const keys = asList(topics[1])
    const source = address.toLowerCase() === consensus ? consensusLogs : sentinelLogs
    return source
      .filter((log) => log.blockNumber >= from && log.blockNumber <= to)
      .filter((log) => keys.includes(log.topics[1]?.toLowerCase() ?? ''))
      .map((log) => ({
        address,
        topics: log.topics,
        data: log.data,
        blockNumber: toHex(log.blockNumber),
        transactionHash: log.transactionHash,
        transactionIndex: '0x0',
        blockHash: keccak256(toBeHex(log.blockNumber, 32)),
        logIndex: toHex(log.logIndex),
        removed: false,
      }))
  }

  const call = ({ to }: { to: string }) =>
    to.toLowerCase() === SAFENET_COORDINATOR_ADDRESS.toLowerCase()
      ? abi.encode(['uint256', 'uint256'], [GROUP_KEY.x, GROUP_KEY.y])
      : keccak256(toUtf8Bytes('safenet-story-group-id'))

  const answer = (req: RpcRequest) => {
    const ok = (result: unknown) => ({ jsonrpc: '2.0', id: req.id, result })
    switch (req.method) {
      case 'eth_chainId':
        return ok('0x64')
      case 'eth_blockNumber':
        return ok(toHex(HEAD_BLOCK))
      case 'eth_getBlockByNumber': {
        const tag = req.params[0] as string
        return ok(blockHeader(tag === 'latest' ? HEAD_BLOCK : Number(BigInt(tag))))
      }
      case 'eth_getLogs':
        return ok(getLogs(req.params[0] as LogFilter))
      case 'eth_call':
        return ok(call(req.params[0] as { to: string }))
      default:
        return { jsonrpc: '2.0', id: req.id, error: { code: -32601, message: `unhandled ${req.method}` } }
    }
  }

  return http.post(RPC_URL, async ({ request }) => {
    const body = (await request.json()) as RpcRequest | RpcRequest[]
    return HttpResponse.json(Array.isArray(body) ? body.map(answer) : answer(body))
  })
}
