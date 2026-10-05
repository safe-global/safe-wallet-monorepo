import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { secp256k1 } from '@noble/curves/secp256k1'
import { setupServer, type SetupServerApi } from 'msw/node'
import { SafenetReader } from '../safenetReader'
import { attestedEvent } from '../../builders/checkEvents'
import { AttestationVerificationStatus, type Hex } from '../../types'
import { makeEndpoint, type RpcConfig } from './rpcEndpoint'
import { decodeLogs, type RawLog } from '../../utils/decodeLogs'
import { CheckEventType } from '../../types'

type Golden = {
  chainId: string
  consensus: string
  coordinator: string
  oracle?: string
  epoch: string
  safeTxHash: Hex
  requestId?: Hex
  oracleDataHash?: Hex
  signatureId: Hex
  groupId?: Hex
  groupKey: { x: string; y: string }
  r: { x: string; y: string }
  z: string
}

const captured = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/safenet-gnosis-chain.captured.json'), 'utf8'),
) as {
  provenance: { chainId: string; consensus: string; coordinator: string; oracle: string }
  captures: Array<{ epoch: string; safeTxHash: Hex; requestId: Hex; groupKey: Golden['groupKey']; logs: RawLog[] }>
}
const approved = captured.captures[0]
const attested = decodeLogs(approved.logs).find((event) => event.type === CheckEventType.ORACLE_ATTESTED)!
const upgraded: Golden = {
  ...captured.provenance,
  ...approved,
  ...attested.attestation,
  signatureId: attested.signatureId,
  oracleDataHash: attested.oracleDataHash,
}

let server: SetupServerApi
afterEach(() => server?.close())

const readerForGolden = (golden: Golden, over: Partial<RpcConfig> = {}) => {
  const endpoint = makeEndpoint({
    url: 'http://rpc.test/g',
    chainId: golden.chainId,
    epochGroupId: golden.groupId,
    groupKey: golden.groupKey,
    ...over,
  })
  server = setupServer(endpoint.handler)
  server.listen()
  const reader = new SafenetReader({
    rpcUrls: ['http://rpc.test/g'],
    chainId: golden.chainId,
    consensus: golden.consensus,
    coordinator: golden.coordinator,
    oracles: golden.oracle ? [golden.oracle] : [],
  })
  return { reader, endpoint }
}

const upgradedAttested = () =>
  attestedEvent({
    safeTxHash: upgraded.safeTxHash,
    epoch: upgraded.epoch,
    oracle: upgraded.oracle,
    signatureId: upgraded.signatureId,
    oracleDataHash: upgraded.oracleDataHash,
    attestation: { r: { x: upgraded.r.x, y: upgraded.r.y }, z: upgraded.z },
  })

describe('SafenetReader.verifyAttestation — oracle path (Safenet deployment on Gnosis Chain capture)', () => {
  it('resolves VERIFIED for the real Gnosis attestation (getEpochGroupId → groupKey → FROST)', async () => {
    const { reader } = readerForGolden(upgraded)
    const result = await reader.verifyAttestation(upgradedAttested())
    expect(result).toEqual({
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: upgraded.signatureId,
      message: upgraded.requestId,
    })
  })

  it('resolves PENDING (retryable) when the group key cannot be fetched', async () => {
    const { reader } = readerForGolden(upgraded, { failGroupKey: true })
    const result = await reader.verifyAttestation(upgradedAttested())
    expect(result.status).toBe(AttestationVerificationStatus.PENDING)
  })

  it('rotates past an endpoint whose eth_call errors without revert data', async () => {
    // ethers turns every JSON-RPC error on an eth_call into a CALL_EXCEPTION.
    // Without revert data that may just be a rate limit or pruned state on one
    // endpoint, so it must rotate to the next URL, and only a revert carrying
    // data may short-circuit the rotation.
    const broken = makeEndpoint({
      url: 'http://rpc.test/broken',
      chainId: upgraded.chainId,
      epochGroupId: upgraded.groupId,
      failGroupKey: true,
    })
    const healthy = makeEndpoint({
      url: 'http://rpc.test/healthy',
      chainId: upgraded.chainId,
      epochGroupId: upgraded.groupId,
      groupKey: upgraded.groupKey,
    })
    server = setupServer(broken.handler, healthy.handler)
    server.listen()
    const reader = new SafenetReader({
      rpcUrls: ['http://rpc.test/broken', 'http://rpc.test/healthy'],
      chainId: upgraded.chainId,
      consensus: upgraded.consensus,
      coordinator: upgraded.coordinator,
      oracles: upgraded.oracle ? [upgraded.oracle] : [],
    })

    const result = await reader.verifyAttestation(upgradedAttested())

    expect(result.status).toBe(AttestationVerificationStatus.VERIFIED)
    expect(healthy.methods.filter((method) => method === 'eth_call').length).toBeGreaterThan(0)
  })

  it('resolves INVALID (terminal) when the signature does not verify against the group key', async () => {
    const { x, y } = secp256k1.Point.BASE.toAffine()
    const { reader } = readerForGolden(upgraded, {
      groupKey: { x: x.toString(), y: y.toString() },
    })
    const result = await reader.verifyAttestation(upgradedAttested())
    expect(result.status).toBe(AttestationVerificationStatus.INVALID)
  })

  it('caches the group key by epoch — a second verify does no further eth_call', async () => {
    const { reader, endpoint } = readerForGolden(upgraded)
    await reader.verifyAttestation(upgradedAttested())
    const callsAfterFirst = endpoint.methods.filter((m) => m === 'eth_call').length
    expect(callsAfterFirst).toBeGreaterThan(0)
    await reader.verifyAttestation(upgradedAttested())
    const callsAfterSecond = endpoint.methods.filter((m) => m === 'eth_call').length
    expect(callsAfterSecond).toBe(callsAfterFirst)
  })

  it('keys the cache by EPOCH — a different epoch triggers its own fetch', async () => {
    // A single-slot cache (ignoring the key) would serve epoch N's key for
    // epoch N+1 and terminalize valid attestations after a key rotation.
    const { reader, endpoint } = readerForGolden(upgraded)
    await reader.verifyAttestation(upgradedAttested())
    const callsAfterFirst = endpoint.methods.filter((m) => m === 'eth_call').length
    await reader.verifyAttestation(attestedEvent({ ...upgradedAttested(), epoch: '999' }))
    const callsAfterOtherEpoch = endpoint.methods.filter((m) => m === 'eth_call').length
    expect(callsAfterOtherEpoch).toBeGreaterThan(callsAfterFirst)
  })

  it('does not cache a failed group-key fetch — a later verify retries the chain', async () => {
    const { reader, endpoint } = readerForGolden(upgraded, { failGroupKey: true })
    await reader.verifyAttestation(upgradedAttested())
    const callsAfterFailure = endpoint.methods.filter((m) => m === 'eth_call').length
    await reader.verifyAttestation(upgradedAttested())
    const callsAfterRetry = endpoint.methods.filter((m) => m === 'eth_call').length
    expect(callsAfterRetry).toBeGreaterThan(callsAfterFailure)
  })

  it('treats an off-curve group key as retryable PENDING — never terminal, never cached', async () => {
    // A corrupt-but-decodable eth_call response must not become a cached key
    // that terminalizes every attestation in the epoch as INVALID.
    const { reader, endpoint } = readerForGolden(upgraded, { groupKey: { x: '1', y: '1' } })
    const first = await reader.verifyAttestation(upgradedAttested())
    expect(first.status).toBe(AttestationVerificationStatus.PENDING)
    const callsAfterFirst = endpoint.methods.filter((m) => m === 'eth_call').length
    const second = await reader.verifyAttestation(upgradedAttested())
    expect(second.status).toBe(AttestationVerificationStatus.PENDING)
    expect(endpoint.methods.filter((m) => m === 'eth_call').length).toBeGreaterThan(callsAfterFirst)
  })
})

describe('SafenetReader.blockTimeMs', () => {
  it('returns the block timestamp in milliseconds', async () => {
    // head 1,000 at t=1,000,000s with 5s blocks → block 900 is 500s earlier.
    const { reader } = readerForGolden(upgraded, { head: 1_000, headTimestamp: 1_000_000 })

    expect(await reader.blockTimeMs(900)).toBe(999_500_000)
  })

  it('costs exactly one header read', async () => {
    const { reader, endpoint } = readerForGolden(upgraded, { head: 1_000, headTimestamp: 1_000_000 })

    await reader.blockTimeMs(900)

    expect(endpoint.methods.filter((method) => method === 'eth_getBlockByNumber')).toHaveLength(1)
  })

  it('degrades to null rather than failing a read whose verdict already verified', async () => {
    const { reader } = readerForGolden(upgraded, { head: 1_000, failBlockProbes: 'error' })

    expect(await reader.blockTimeMs(900)).toBeNull()
  })

  it('returns null when no endpoint can serve the header', async () => {
    const { reader } = readerForGolden(upgraded, { head: 1_000, failBlockProbes: 'null' })

    expect(await reader.blockTimeMs(900)).toBeNull()
  })
})
