import { chainBuilder } from '@/tests/builders/chains'
import { sessionProposalBuilder } from '@/tests/builders/walletConnect'
import { getProposalRisk } from '../proposalRisk'

const configs = [chainBuilder().with({ chainId: '1' }).build(), chainBuilder().with({ chainId: '137' }).build()]

describe('getProposalRisk', () => {
  it('reports no risk for a verified dApp on a supported chain', () => {
    const risk = getProposalRisk(sessionProposalBuilder(), configs, '1')

    expect(risk).toEqual({
      chainIds: ['1'],
      isUnsupportedChain: false,
      isBlocked: false,
      isHighRisk: false,
      isVerified: true,
      isSafePass: false,
    })
  })

  it.each([
    ['a scam', { isScam: true }, { isBlocked: true }],
    ['a blocked bridge', { origin: 'https://cbridge.celer.network' }, { isBlocked: true }],
    ['a warned bridge by origin', { origin: 'https://bridge.arbitrum.io' }, { isHighRisk: true }],
    ['a warned bridge by name', { name: 'Hop' }, { isHighRisk: true }],
    ['a spoofed domain', { validation: 'INVALID' as const }, { isHighRisk: true, isVerified: false }],
    ['an unverified domain', { validation: 'UNKNOWN' as const }, { isVerified: false }],
    ['Safe{Pass}', { origin: 'https://community.safe.global' }, { isSafePass: true }],
  ])('flags %s', (_, overrides, expected) => {
    const risk = getProposalRisk(sessionProposalBuilder(overrides), configs, '1')

    expect(risk).toMatchObject(expected)
  })

  it('flags a chain the dApp does not support', () => {
    const risk = getProposalRisk(sessionProposalBuilder({ chains: ['eip155:137'] }), configs, '1')

    expect(risk).toMatchObject({ chainIds: ['137'], isUnsupportedChain: true })
  })

  it('ignores dApp chains that the Safe does not know', () => {
    const risk = getProposalRisk(sessionProposalBuilder({ chains: ['eip155:1', 'eip155:999'] }), configs, '1')

    expect(risk.chainIds).toEqual(['1'])
  })
})
