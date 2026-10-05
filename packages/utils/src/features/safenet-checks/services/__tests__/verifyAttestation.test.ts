import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { secp256k1 } from '@noble/curves/secp256k1'
import { Interface } from 'ethers'
import type { HttpHandler } from 'msw'
import { setupServer, type SetupServerApi } from 'msw/node'
import { COORDINATOR_READ_ABI } from '../../abi'
import { SAFENET_DEPLOYMENT } from '../../constants'
import { SafenetReader } from '../safenetReader'
import { decodeLogs, type RawLog } from '../../utils/decodeLogs'
import {
  AttestationVerificationStatus,
  CheckEventType,
  type AttestationInput,
  type Hex,
  type OracleAttestedEvent,
} from '../../types'
import { makeEndpoint, type EthCall, type RpcConfig } from './rpcEndpoint'

type Point = { x: string; y: string }

type Capture = {
  label: string
  safeTxHash: Hex
  epoch: string
  requestId: Hex
  oracleDataHash: Hex
  attestation: { signatureId: Hex; r: Point; z: string } | null
  groupKey: Point | null
  logs: RawLog[]
}

type Approved = Capture & { attestation: NonNullable<Capture['attestation']>; groupKey: Point }

const fixture: { provenance: { oracle: string }; captures: Capture[] } = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/gnosis-aegis.json'), 'utf8'),
)

const { oracle } = fixture.provenance

const approvedCapture = (label: string): Approved => {
  const found = fixture.captures.find((entry) => entry.label === label)
  if (!found?.attestation || !found.groupKey) throw new Error(`fixture capture ${label} carries no attestation`)
  return { ...found, attestation: found.attestation, groupKey: found.groupKey }
}

const first = approvedCapture('approved-first')
const second = approvedCapture('approved-second')
const approvedCaptures = [first, second]

const inputOf = (capture: Approved): AttestationInput => ({
  epoch: capture.epoch,
  oracle,
  oracleDataHash: capture.oracleDataHash,
  safeTxHash: capture.safeTxHash,
  signatureId: capture.attestation.signatureId,
  attestation: { r: { ...capture.attestation.r }, z: capture.attestation.z },
})

const loggedAttestation = (capture: Approved): OracleAttestedEvent => {
  const attested = decodeLogs(capture.logs).find(
    (event): event is OracleAttestedEvent => event.type === CheckEventType.ORACLE_ATTESTED,
  )
  if (!attested) throw new Error(`fixture capture ${capture.label} carries no TransactionAttested log`)
  return attested
}

const pointOf = (scalar: bigint): Point => {
  const { x, y } = secp256k1.Point.BASE.multiply(scalar).toAffine()
  return { x: x.toString(), y: y.toString() }
}

const RPC_URL = 'http://rpc.test/gnosis'
const GROUP_ID = `0x${'11'.repeat(32)}`
const OTHER_ADDRESS = `0x${'11'.repeat(20)}`
const OTHER_HASH: Hex = `0x${'ab'.repeat(32)}`

const coordinatorInterface = new Interface([...COORDINATOR_READ_ABI])
const GROUP_KEY_SELECTOR = coordinatorInterface.getFunction('groupKey')!.selector

type Endpoint = { handler: HttpHandler; ethCalls: EthCall[]; methods: string[] }

const groupKeyReads = (endpoint: Endpoint): number =>
  endpoint.ethCalls.filter((call) => call.selector === GROUP_KEY_SELECTOR).length

let server: SetupServerApi
afterEach(() => server?.close())

const newReader = (rpcUrls: string[]) =>
  new SafenetReader({
    rpcUrls,
    chainId: SAFENET_DEPLOYMENT.chainId,
    consensus: SAFENET_DEPLOYMENT.consensus,
    coordinator: SAFENET_DEPLOYMENT.coordinator,
    oracles: [oracle],
  })

const serve = (...endpoints: Endpoint[]) => {
  server = setupServer(...endpoints.map(({ handler }) => handler))
  server.listen()
}

/** `config` stays live: the endpoint reads it per request, so a test can heal a fault between verifies. */
const readerFor = (over: Partial<RpcConfig> = {}) => {
  const config: RpcConfig = { url: RPC_URL, epochGroupId: GROUP_ID, groupKey: first.groupKey, ...over }
  const endpoint = makeEndpoint(config)
  serve(endpoint)
  return { reader: newReader([RPC_URL]), endpoint, config }
}

describe('SafenetReader.verifyAttestation — real Gnosis attestations', () => {
  it.each(approvedCaptures)(
    'resolves VERIFIED for the real $label attestation, bound to its request id',
    async (capture) => {
      const { reader } = readerFor({ groupKey: capture.groupKey })

      const result = await reader.verifyAttestation(inputOf(capture))

      expect(result).toEqual({
        status: AttestationVerificationStatus.VERIFIED,
        signatureId: capture.attestation.signatureId,
        message: capture.requestId,
      })
    },
  )

  it.each(approvedCaptures)(
    'verifies the log-derived and the getter-derived input of $label identically',
    async (capture) => {
      const { reader } = readerFor({ groupKey: capture.groupKey })

      const fromLog = await reader.verifyAttestation(loggedAttestation(capture))
      const fromGetter = await reader.verifyAttestation(inputOf(capture))

      expect(fromLog.status).toBe(AttestationVerificationStatus.VERIFIED)
      expect(fromLog).toEqual(fromGetter)
    },
  )
})

describe('SafenetReader.verifyAttestation — attestations that must never verify', () => {
  type Tamper = (attestation: AttestationInput['attestation']) => AttestationInput['attestation']
  const signatureTampers: Array<[string, Tamper]> = [
    ['a different scalar z', ({ r, z }) => ({ r, z: (BigInt(z) + 1n).toString() })],
    ['another valid commitment point r', ({ z }) => ({ r: pointOf(3n), z })],
    ['an r that is off the curve', ({ r, z }) => ({ r: { x: r.x, y: (BigInt(r.y) + 1n).toString() }, z })],
  ]

  it.each(signatureTampers)('resolves INVALID, not PENDING or VERIFIED, for %s', async (_name, tamper) => {
    const { reader } = readerFor()
    const input = inputOf(first)

    const result = await reader.verifyAttestation({ ...input, attestation: tamper(input.attestation) })

    expect(result.status).toBe(AttestationVerificationStatus.INVALID)
  })

  it('resolves INVALID when the epoch group key is another valid curve point', async () => {
    const { reader } = readerFor({ groupKey: pointOf(7n) })

    const result = await reader.verifyAttestation(inputOf(first))

    expect(result.status).toBe(AttestationVerificationStatus.INVALID)
  })

  const messageTampers: Array<[string, Partial<AttestationInput>]> = [
    ['oracleDataHash', { oracleDataHash: OTHER_HASH }],
    ['epoch', { epoch: '161992' }],
    ['safeTxHash', { safeTxHash: second.safeTxHash }],
    ['oracle', { oracle: OTHER_ADDRESS }],
  ]

  it.each(messageTampers)(
    'resolves INVALID for a genuine signature presented with a different %s',
    async (_field, change) => {
      const { reader } = readerFor()

      const result = await reader.verifyAttestation({ ...inputOf(first), ...change })

      expect(result.status).toBe(AttestationVerificationStatus.INVALID)
      expect(result.message).not.toBe(first.requestId)
    },
  )
})

describe('SafenetReader.verifyAttestation — group key retrieval', () => {
  it('resolves PENDING when the group key cannot be fetched, then VERIFIED once it can', async () => {
    const { reader, config } = readerFor({ failGroupKey: true })

    const failed = await reader.verifyAttestation(inputOf(first))
    config.failGroupKey = false
    const retried = await reader.verifyAttestation(inputOf(first))

    expect(failed.status).toBe(AttestationVerificationStatus.PENDING)
    expect(retried.status).toBe(AttestationVerificationStatus.VERIFIED)
  })

  it('rotates past an endpoint whose eth_call errors without revert data', async () => {
    // ethers turns every JSON-RPC error on an eth_call into a CALL_EXCEPTION.
    // Without revert data that may just be a rate limit or pruned state on one
    // endpoint, so it must rotate to the next URL, and only a revert carrying
    // data may short-circuit the rotation.
    const broken = makeEndpoint({
      url: 'http://rpc.test/broken',
      epochGroupId: GROUP_ID,
      failGroupKey: true,
    })
    const healthy = makeEndpoint({
      url: 'http://rpc.test/healthy',
      epochGroupId: GROUP_ID,
      groupKey: first.groupKey,
    })
    serve(broken, healthy)

    const result = await newReader(['http://rpc.test/broken', 'http://rpc.test/healthy']).verifyAttestation(
      inputOf(first),
    )

    expect(result.status).toBe(AttestationVerificationStatus.VERIFIED)
    expect(groupKeyReads(healthy)).toBe(1)
  })

  it('treats an off-curve group key as retryable PENDING that is never cached', async () => {
    const { reader, config } = readerFor({ groupKey: { x: '1', y: '1' } })

    const corrupt = await reader.verifyAttestation(inputOf(first))
    config.groupKey = first.groupKey
    const healed = await reader.verifyAttestation(inputOf(first))

    expect(corrupt.status).toBe(AttestationVerificationStatus.PENDING)
    expect(healed.status).toBe(AttestationVerificationStatus.VERIFIED)
  })

  it('reads the group key once per epoch, across attestations of that epoch', async () => {
    const { reader, endpoint } = readerFor()

    const results = [await reader.verifyAttestation(inputOf(first)), await reader.verifyAttestation(inputOf(second))]

    expect(results.map((result) => result.status)).toEqual([
      AttestationVerificationStatus.VERIFIED,
      AttestationVerificationStatus.VERIFIED,
    ])
    expect(groupKeyReads(endpoint)).toBe(1)
  })

  it('fetches the group key of a different epoch on its own', async () => {
    const { reader, endpoint } = readerFor()

    await reader.verifyAttestation(inputOf(first))
    await reader.verifyAttestation({ ...inputOf(first), epoch: '161992' })

    expect(groupKeyReads(endpoint)).toBe(2)
  })

  const endpointFaults: Array<[string, Partial<RpcConfig>, Partial<RpcConfig>]> = [
    ['serves another chain', { chainId: '11155111' }, { chainId: SAFENET_DEPLOYMENT.chainId }],
    ['reports another Coordinator', { coordinator: OTHER_ADDRESS }, { coordinator: SAFENET_DEPLOYMENT.coordinator }],
    [
      'has an Oracle proposed by another Consensus',
      { proposer: OTHER_ADDRESS },
      { proposer: SAFENET_DEPLOYMENT.consensus },
    ],
  ]

  it.each(endpointFaults)(
    'trusts no group key from an endpoint that %s, and verifies once it is right',
    async (_fault, fault, fix) => {
      const { reader, endpoint, config } = readerFor(fault)

      const refused = await reader.verifyAttestation(inputOf(first))
      const readsWhileFaulty = groupKeyReads(endpoint)
      Object.assign(config, fix)
      const accepted = await reader.verifyAttestation(inputOf(first))

      expect(refused.status).toBe(AttestationVerificationStatus.PENDING)
      expect(readsWhileFaulty).toBe(0)
      expect(accepted.status).toBe(AttestationVerificationStatus.VERIFIED)
    },
  )
})

describe('SafenetReader.blockTimeMs', () => {
  it('returns the block timestamp in milliseconds', async () => {
    // head 1,000 at t=1,000,000s with 5s blocks → block 900 is 500s earlier.
    const { reader } = readerFor({ head: 1_000, headTimestamp: 1_000_000 })

    expect(await reader.blockTimeMs(900)).toBe(999_500_000)
  })

  it('costs exactly one header read', async () => {
    const { reader, endpoint } = readerFor({ head: 1_000, headTimestamp: 1_000_000 })

    await reader.blockTimeMs(900)

    expect(endpoint.methods.filter((method) => method === 'eth_getBlockByNumber')).toHaveLength(1)
  })

  it('degrades to null rather than failing a read whose verdict already verified', async () => {
    const { reader } = readerFor({ head: 1_000, failBlockProbes: 'error' })

    expect(await reader.blockTimeMs(900)).toBeNull()
  })

  it('returns null when no endpoint can serve the header', async () => {
    const { reader } = readerFor({ head: 1_000, failBlockProbes: 'null' })

    expect(await reader.blockTimeMs(900)).toBeNull()
  })
})
