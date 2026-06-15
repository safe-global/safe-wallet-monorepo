import type { ProposalTypes } from '@walletconnect/types'
import {
  buildSafeApprovedNamespaces,
  buildSafeSessionProperties,
  collectNamespaceChains,
  isProposalSupported,
} from '../namespaces'

// Fixed checksummed address so the snapshot is deterministic.
const SAFE = '0x1111111111111111111111111111111111111111'

const makeProposal = (overrides: Partial<ProposalTypes.Struct> = {}): ProposalTypes.Struct =>
  ({
    id: 1,
    expiryTimestamp: 0,
    relays: [{ protocol: 'irn' }],
    proposer: { publicKey: 'pk', metadata: { name: 'dApp', description: '', url: 'https://dapp.test', icons: [] } },
    requiredNamespaces: {
      eip155: { chains: ['eip155:1'], methods: ['eth_sendTransaction'], events: ['chainChanged'] },
    },
    optionalNamespaces: {
      eip155: { chains: ['eip155:137'], methods: ['eth_accounts'], events: ['accountsChanged'] },
    },
    pairingTopic: 'topic',
    ...overrides,
  }) as unknown as ProposalTypes.Struct

describe('buildSafeApprovedNamespaces', () => {
  it('produces eip155 namespaces with checksummed accounts (snapshot)', () => {
    const namespaces = buildSafeApprovedNamespaces({
      proposal: makeProposal(),
      safeAddress: SAFE,
      supportedChains: [{ chainId: '1' }, { chainId: '137' }],
    })
    expect(namespaces).toMatchSnapshot()
  })

  it('intersects the proposal chains with the Safe deployments', () => {
    // Safe only on mainnet; dApp optionally wants polygon too.
    const namespaces = buildSafeApprovedNamespaces({
      proposal: makeProposal(),
      safeAddress: SAFE,
      supportedChains: [{ chainId: '1' }],
    })
    expect(namespaces.eip155.accounts).toEqual(['eip155:1:' + SAFE])
  })

  it('checksums the account address (EIP-55)', () => {
    const lowercase = '0xab5801a7d398351b8be11c439e05c5b3259aec9b'
    const checksummed = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'
    const namespaces = buildSafeApprovedNamespaces({
      proposal: makeProposal(),
      safeAddress: lowercase,
      supportedChains: [{ chainId: '1' }],
    })
    expect(namespaces.eip155.accounts).toEqual(['eip155:1:' + checksummed])
  })
})

describe('buildSafeSessionProperties', () => {
  it('advertises atomic-batch support keyed by the checksummed Safe address', () => {
    const props = buildSafeSessionProperties({ safeAddress: SAFE, supportedChains: [{ chainId: '1' }] })
    expect(JSON.parse(props.atomic)).toEqual({ status: 'supported' })
    const capabilities = JSON.parse(props.capabilities)
    expect(capabilities[SAFE]['0x1']).toEqual({ atomic: { status: 'supported' }, atomicBatch: { supported: true } })
  })
})

describe('isProposalSupported', () => {
  it('is true when every required namespace key is eip155', () => {
    expect(isProposalSupported(makeProposal())).toBe(true)
  })

  it('is false when a non-eip155 namespace is required', () => {
    const proposal = makeProposal({
      requiredNamespaces: {
        solana: { chains: ['solana:1'], methods: [], events: [] },
      } as unknown as ProposalTypes.Struct['requiredNamespaces'],
    })
    expect(isProposalSupported(proposal)).toBe(false)
  })
})

describe('collectNamespaceChains', () => {
  it('reads chain-agnostic namespaces from their chains array', () => {
    expect(collectNamespaceChains({ eip155: { chains: ['eip155:1', 'eip155:137'] } })).toEqual([
      'eip155:1',
      'eip155:137',
    ])
  })

  it('derives the chain from CAIP-2 namespace keys that have no chains array', () => {
    expect(collectNamespaceChains({ 'eip155:1': {}, 'eip155:10': {} })).toEqual(['eip155:1', 'eip155:10'])
  })
})
