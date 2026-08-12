import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { setupServer, type SetupServerApi } from 'msw/node'
import { SafenetReader } from '../safenetReader'
import { attestedEvent, plainAttestedEvent } from '../../builders/checkEvents'
import { plainProposalHash } from '../../utils/oracleProposalHash'
import { AttestationVerificationStatus, type Hex } from '../../types'
import { makeEndpoint, type RpcConfig } from './rpcEndpoint'

type Golden = {
  chainId: string
  consensus: string
  coordinator: string
  oracle?: string
  epoch: string
  safeTxHash: Hex
  requestId?: Hex
  signatureId: Hex
  groupId: Hex
  groupKey: { x: string; y: string }
  r: { x: string; y: string }
  z: string
}

/** Real oracle-path attestation captured from the devnet (AlwaysApproveOracle). */
const devnet: Golden = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/devnet-attestation.golden.json'), 'utf8'),
)

/** Real non-oracle attestation captured from Gnosis mainnet beta — the only path live beta emits. */
const gnosis: Golden = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/gnosis-plain-attestation.golden.json'), 'utf8'),
)

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

const devnetAttested = () =>
  attestedEvent({
    safeTxHash: devnet.safeTxHash,
    epoch: devnet.epoch,
    oracle: devnet.oracle,
    signatureId: devnet.signatureId,
    attestation: { r: { x: devnet.r.x, y: devnet.r.y }, z: devnet.z },
  })

describe('SafenetReader.verifyAttestation — oracle path (devnet golden)', () => {
  it('resolves VERIFIED for the real devnet attestation (getEpochGroupId → groupKey → FROST)', async () => {
    const { reader } = readerForGolden(devnet)
    const result = await reader.verifyAttestation(devnetAttested())
    expect(result).toEqual({
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: devnet.signatureId,
      message: devnet.requestId,
    })
  })

  it('resolves PENDING (retryable) when the group key cannot be fetched', async () => {
    const { reader } = readerForGolden(devnet, { failGroupKey: true })
    const result = await reader.verifyAttestation(devnetAttested())
    expect(result.status).toBe(AttestationVerificationStatus.PENDING)
  })

  it('rotates past an endpoint whose eth_call errors without revert data', async () => {
    // ethers turns every JSON-RPC error on an eth_call into a CALL_EXCEPTION.
    // Without revert data that may just be a rate limit or pruned state on one
    // endpoint, so it must rotate to the next URL, and only a revert carrying
    // data may short-circuit the rotation.
    const broken = makeEndpoint({
      url: 'http://rpc.test/broken',
      chainId: devnet.chainId,
      epochGroupId: devnet.groupId,
      failGroupKey: true,
    })
    const healthy = makeEndpoint({
      url: 'http://rpc.test/healthy',
      chainId: devnet.chainId,
      epochGroupId: devnet.groupId,
      groupKey: devnet.groupKey,
    })
    server = setupServer(broken.handler, healthy.handler)
    server.listen()
    const reader = new SafenetReader({
      rpcUrls: ['http://rpc.test/broken', 'http://rpc.test/healthy'],
      chainId: devnet.chainId,
      consensus: devnet.consensus,
      coordinator: devnet.coordinator,
      oracles: devnet.oracle ? [devnet.oracle] : [],
    })

    const result = await reader.verifyAttestation(devnetAttested())

    expect(result.status).toBe(AttestationVerificationStatus.VERIFIED)
    expect(healthy.methods.filter((method) => method === 'eth_call').length).toBeGreaterThan(0)
  })

  it('resolves INVALID (terminal) when the signature does not verify against the group key', async () => {
    // A wrong-but-VALID curve point (another epoch's real key) — an off-curve
    // tamper would be rejected as PENDING by the on-curve gate instead.
    const { reader } = readerForGolden(devnet, { groupKey: gnosis.groupKey })
    const result = await reader.verifyAttestation(devnetAttested())
    expect(result.status).toBe(AttestationVerificationStatus.INVALID)
  })

  it('caches the group key by epoch — a second verify does no further eth_call', async () => {
    const { reader, endpoint } = readerForGolden(devnet)
    await reader.verifyAttestation(devnetAttested())
    const callsAfterFirst = endpoint.methods.filter((m) => m === 'eth_call').length
    expect(callsAfterFirst).toBeGreaterThan(0)
    await reader.verifyAttestation(devnetAttested())
    const callsAfterSecond = endpoint.methods.filter((m) => m === 'eth_call').length
    expect(callsAfterSecond).toBe(callsAfterFirst)
  })

  it('keys the cache by EPOCH — a different epoch triggers its own fetch', async () => {
    // A single-slot cache (ignoring the key) would serve epoch N's key for
    // epoch N+1 and terminalize valid attestations after a key rotation.
    const { reader, endpoint } = readerForGolden(devnet)
    await reader.verifyAttestation(devnetAttested())
    const callsAfterFirst = endpoint.methods.filter((m) => m === 'eth_call').length
    await reader.verifyAttestation(attestedEvent({ ...devnetAttested(), epoch: '999' }))
    const callsAfterOtherEpoch = endpoint.methods.filter((m) => m === 'eth_call').length
    expect(callsAfterOtherEpoch).toBeGreaterThan(callsAfterFirst)
  })

  it('does not cache a failed group-key fetch — a later verify retries the chain', async () => {
    const { reader, endpoint } = readerForGolden(devnet, { failGroupKey: true })
    await reader.verifyAttestation(devnetAttested())
    const callsAfterFailure = endpoint.methods.filter((m) => m === 'eth_call').length
    await reader.verifyAttestation(devnetAttested())
    const callsAfterRetry = endpoint.methods.filter((m) => m === 'eth_call').length
    expect(callsAfterRetry).toBeGreaterThan(callsAfterFailure)
  })

  it('treats an off-curve group key as retryable PENDING — never terminal, never cached', async () => {
    // A corrupt-but-decodable eth_call response must not become a cached key
    // that terminalizes every attestation in the epoch as INVALID.
    const { reader, endpoint } = readerForGolden(devnet, { groupKey: { x: '1', y: '1' } })
    const first = await reader.verifyAttestation(devnetAttested())
    expect(first.status).toBe(AttestationVerificationStatus.PENDING)
    const callsAfterFirst = endpoint.methods.filter((m) => m === 'eth_call').length
    const second = await reader.verifyAttestation(devnetAttested())
    expect(second.status).toBe(AttestationVerificationStatus.PENDING)
    expect(endpoint.methods.filter((m) => m === 'eth_call').length).toBeGreaterThan(callsAfterFirst)
  })
})

describe('SafenetReader.verifyAttestation — non-oracle path (live Gnosis beta golden)', () => {
  it('derives the PLAIN preimage for a TransactionAttested and verifies the live capture', async () => {
    // The two paths sign different EIP-712 preimages; live beta only emits this
    // one. The domain chainId is the Safenet chain (100), NOT the event's Safe
    // chain (42161 here) — crossing them fails verification.
    const { reader } = readerForGolden(gnosis)
    const result = await reader.verifyAttestation(
      plainAttestedEvent({
        safeTxHash: gnosis.safeTxHash,
        epoch: gnosis.epoch,
        signatureId: gnosis.signatureId,
        attestation: { r: { x: gnosis.r.x, y: gnosis.r.y }, z: gnosis.z },
      }),
    )
    expect(result).toEqual({
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: gnosis.signatureId,
      message: plainProposalHash({
        chainId: gnosis.chainId,
        consensus: gnosis.consensus,
        epoch: gnosis.epoch,
        safeTxHash: gnosis.safeTxHash,
      }),
    })
  })
})
