import { faker } from '@faker-js/faker'
import type { WalletKitTypes } from '@reown/walletkit'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { Builder, type IBuilder } from '@/tests/Builder'

type SessionProposalOverrides = {
  origin?: string
  validation?: 'VALID' | 'INVALID' | 'UNKNOWN'
  isScam?: boolean
  name?: string
  /** The URL the dApp declares about itself */
  url?: string
  chains?: string[]
}

export const sessionProposalBuilder = (overrides: SessionProposalOverrides = {}): WalletKitTypes.SessionProposal => {
  const id = faker.number.int({ min: 1, max: 999_999 })
  const origin = overrides.origin ?? faker.internet.url({ appendSlash: false })

  return {
    id,
    params: {
      id,
      expiryTimestamp: Date.now() + 300_000,
      pairingTopic: faker.string.hexadecimal({ length: 64, prefix: '' }),
      proposer: {
        publicKey: faker.string.hexadecimal({ length: 64, prefix: '' }),
        metadata: {
          name: overrides.name ?? faker.company.name(),
          description: faker.lorem.sentence(),
          url: overrides.url ?? origin,
          icons: [`${origin}/icon.png`],
        },
      },
      requiredNamespaces: {
        eip155: {
          methods: ['eth_sendTransaction'],
          chains: overrides.chains ?? ['eip155:1'],
          events: ['chainChanged'],
        },
      },
      optionalNamespaces: {},
      relays: [{ protocol: 'irn' }],
    },
    verifyContext: {
      verified: {
        validation: overrides.validation ?? 'VALID',
        origin,
        verifyUrl: 'https://verify.walletconnect.org',
        isScam: overrides.isScam ?? false,
      },
    },
  }
}

export const safeAppBuilder = (): IBuilder<SafeAppData> => {
  const url = faker.internet.url({ appendSlash: false })

  return Builder.new<SafeAppData>().with({
    id: faker.number.int({ min: 1, max: 999 }),
    url,
    name: faker.company.name(),
    iconUrl: `${url}/icon.png`,
    description: faker.lorem.sentence(),
    chainIds: ['1'],
    accessControl: { type: 'NO_RESTRICTIONS' },
    tags: [],
    features: [],
    socialProfiles: [],
    featured: false,
  })
}
