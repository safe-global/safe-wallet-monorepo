import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeOverview, SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type {
  ActivePolicyDto,
  SpaceAddressBookItemDto,
  SpacePoliciesGetPendingPoliciesV1ApiResponse,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { UserWithWallets } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { RootState } from '@/store'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { getPolicyGuardAddress } from '@/features/policy-guard/public/services/policyEngineDeployments'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { fakerChecksummedAddress } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { addressExBuilder, safeInfoBuilder } from '@/tests/builders/safe'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import { memberBuilder, memberUserBuilder } from '@/tests/builders/member'
import { spaceBuilder, spaceMemberBuilder, spaceMemberUserBuilder } from '@/tests/builders/space'

/** A chain the allowlist runs on: the policy indexer knows its guard and its native transfer policy. */
export const ALLOWLIST_CHAIN_ID = '11155111'

// Fixed across tests: the read-only provider for a chain is cached for the whole test file.
const ALLOWLIST_RPC_URL = 'https://rpc.allowlist.test/sepolia'

export type AllowlistWorkspace = {
  spaceId: string
  chain: Chain
  safe: SafeState
  wallet: ConnectedWallet
  guardAddress: string
}

/** A signed-in signer of one Safe in a Workspace, on a chain that has the allowlist switched on. */
export const buildAllowlistWorkspace = (): AllowlistWorkspace => {
  const wallet = connectedWalletBuilder()
    .with({ address: fakerChecksummedAddress(), chainId: ALLOWLIST_CHAIN_ID })
    .build()
  const chain = chainBuilder()
    .with({
      chainId: ALLOWLIST_CHAIN_ID,
      shortName: 'sep',
      chainName: 'Sepolia',
      l2: false,
      zk: false,
      features: [FEATURES.POLICY_RECIPIENT_ALLOWLIST],
      rpcUri: { authentication: 'NO_AUTHENTICATION', value: ALLOWLIST_RPC_URL },
    })
    .build()
  const safe = safeInfoBuilder()
    .with({
      chainId: ALLOWLIST_CHAIN_ID,
      address: addressExBuilder().with({ name: null, logoUri: null }).build(),
      owners: [addressExBuilder().with({ value: wallet.address }).build(), addressExBuilder().build()],
      threshold: 2,
      nonce: 0,
      version: '1.5.0',
      implementation: addressExBuilder().with({ name: null, logoUri: null }).build(),
      guard: null,
    })
    .build()

  return {
    spaceId: faker.string.uuid(),
    chain,
    safe,
    wallet,
    guardAddress: getPolicyGuardAddress(ALLOWLIST_CHAIN_ID) ?? '',
  }
}

export const signedInState = (): Partial<RootState> => ({
  auth: {
    sessionExpiresAt: Date.now() + 3_600_000,
    landingSpaceHint: null,
    isStoreHydrated: true,
    cfSafeSynced: false,
    isOidcLoginPending: false,
    isSessionCheckPending: false,
  },
})

const contact = (chainId: string, address: string, name: string): SpaceAddressBookItemDto => ({
  name,
  address,
  chainIds: [chainId],
  createdBy: faker.internet.email(),
  createdByUserId: faker.number.int({ min: 1, max: 1_000 }),
  lastUpdatedBy: faker.internet.email(),
  lastUpdatedByUserId: faker.number.int({ min: 1, max: 1_000 }),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.past().toISOString(),
  tagIds: [],
})

type ServeOptions = {
  balances?: Balances
  /** Space address book names, by address. */
  contacts?: Record<string, string>
  active?: ActivePolicyDto[]
  pending?: SpacePoliciesGetPendingPoliciesV1ApiResponse
}

/** Answers every CGW request the Policies page and the allowlist flows send for `workspace`. */
export const serveAllowlistWorkspace = (
  { spaceId, chain, safe, wallet }: AllowlistWorkspace,
  options: ServeOptions = {},
) => {
  const userId = faker.number.int({ min: 1, max: 1_000 })
  const user: UserWithWallets = { id: userId, status: 1, wallets: [{ id: userId, address: wallet.address }] }
  const space = spaceBuilder()
    .with({
      uuid: spaceId,
      safeCount: 1,
      members: [
        spaceMemberBuilder()
          .with({ user: spaceMemberUserBuilder().with({ id: userId }).build() })
          .build(),
      ],
    })
    .build()
  const overview: SafeOverview = {
    address: safe.address,
    chainId: safe.chainId,
    threshold: safe.threshold,
    owners: safe.owners,
    fiatTotal: '0',
    queued: 0,
  }

  server.use(
    http.get(`${GATEWAY_URL}/v2/chains`, () =>
      HttpResponse.json({ count: 1, next: null, previous: null, results: [chain] }),
    ),
    http.get(`${GATEWAY_URL}/v2/chains/:chainId`, () => HttpResponse.json(chain)),
    http.get(`${GATEWAY_URL}/v1/users`, () => HttpResponse.json(user)),
    http.get(`${GATEWAY_URL}/v1/spaces/:spaceId`, () => HttpResponse.json(space)),
    http.get(`${GATEWAY_URL}/v1/spaces/:spaceId/safes`, () =>
      HttpResponse.json({ safes: { [safe.chainId]: [safe.address.value] } }),
    ),
    http.get(`${GATEWAY_URL}/v1/spaces/:spaceId/members`, () =>
      HttpResponse.json({
        members: [
          memberBuilder()
            .with({ user: memberUserBuilder().with({ id: userId }).build() })
            .build(),
        ],
      }),
    ),
    http.get(`${GATEWAY_URL}/v1/spaces/:spaceId/address-book`, () =>
      HttpResponse.json({
        spaceUuid: spaceId,
        data: Object.entries(options.contacts ?? {}).map(([address, name]) => contact(safe.chainId, address, name)),
      }),
    ),
    http.get(`${GATEWAY_URL}/v2/safes`, () => HttpResponse.json([overview])),
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, () => HttpResponse.json(safe)),
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/nonces`, () =>
      HttpResponse.json({ currentNonce: safe.nonce, recommendedNonce: safe.nonce }),
    ),
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/balances/:fiatCode`, () =>
      HttpResponse.json(options.balances ?? { fiatTotal: '0', items: [] }),
    ),
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/tokens`, () => HttpResponse.json([])),
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/owners/:owner/safes`, () => HttpResponse.json({ safes: [] })),
    http.get(`${GATEWAY_URL}/v2/owners/:owner/safes`, () => HttpResponse.json({})),
    http.get(`${GATEWAY_URL}/v2/chains/:chainId/delegates`, () =>
      HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
    ),
    http.get(`${GATEWAY_URL}/v1/spaces/:spaceId/policies/active`, () => HttpResponse.json(options.active ?? [])),
    http.get(`${GATEWAY_URL}/v1/spaces/:spaceId/policies/pending`, () => HttpResponse.json(options.pending ?? [])),
  )
}

type JsonRpcRequest = { id: number; method: string; params: unknown[] }

const ZERO_WORD = `0x${'0'.repeat(64)}`

/** A node for `workspace`'s chain that knows the Safe is deployed, with a nonce of 0 and no module guard. */
export const serveAllowlistRpc = ({ chain }: AllowlistWorkspace) => {
  const answer = ({ id, method }: JsonRpcRequest) => {
    const results: Record<string, string> = {
      eth_chainId: `0x${Number(chain.chainId).toString(16)}`,
      net_version: chain.chainId,
      eth_blockNumber: '0x1',
      eth_getCode: '0x6080604052',
      eth_call: ZERO_WORD,
      eth_getStorageAt: ZERO_WORD,
    }
    const result = results[method]
    return result === undefined
      ? { jsonrpc: '2.0', id, error: { code: -32601, message: `${method} is not served` } }
      : { jsonrpc: '2.0', id, result }
  }

  server.use(
    http.post(chain.rpcUri.value, async ({ request }) => {
      const body = (await request.json()) as JsonRpcRequest | JsonRpcRequest[]
      return HttpResponse.json(Array.isArray(body) ? body.map(answer) : answer(body))
    }),
  )
}
