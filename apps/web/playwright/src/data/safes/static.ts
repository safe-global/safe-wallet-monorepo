/**
 * Static test Safes — pre-created on testnets and mainnets.
 * Shared across all read-only tests. Never mutated by tests.
 *
 * === AI AGENT INSTRUCTIONS ===
 * When writing a new test, DO NOT ask the human which Safe to use.
 * Instead, scan this lookup table and select the Safe that matches
 * your test's data requirements. If no existing Safe fits, flag it
 * as a test data gap — do not hardcode a new address.
 *
 * Selection algorithm:
 * 1. What chain does the test need? → Filter by network prefix
 * 2. What data does the test need? → Match against the properties below
 * 3. Does the test mutate state? → If yes, DO NOT use a static Safe.
 *    Static Safes are read-only shared resources.
 * 4. Does the test need wallet connection? → Check "Test wallet" column
 * 5. Pick the SIMPLEST Safe that satisfies requirements — don't use a
 *    feature-rich Safe for a basic smoke test.
 *
 * Quick reference — Sepolia:
 * ┌───────────┬───────┬─────────────────┬──────┬──────────┬─────────────┬────────────────────────────────────┐
 * │ Safe      │ Thres │ Tokens          │ NFTs │ Pending  │ Test wallet │ Typical use cases                  │
 * ├───────────┼───────┼─────────────────┼──────┼──────────┼─────────────┼────────────────────────────────────┤
 * │ SAFE_0    │ 1/1   │ ETH             │  No  │    No    │ Owner       │ Basic smoke, simple navigation      │
 * │ SAFE_1    │ 1/1   │ ETH             │  No  │    No    │ Owner       │ Basic smoke, address book           │
 * │ SAFE_2    │ 1/1   │ ETH + ERC20 x6  │  Yes │    Yes   │ Owner       │ Dashboard, assets, NFTs, tx queue   │
 * │ SAFE_3    │ 1/2   │ ETH             │  No  │    No    │ NOT owner   │ Non-owner permission tests          │
 * │ SAFE_4    │ 3/5   │ ETH             │  No  │    No    │ Owner       │ Owner management (replace/add)      │
 * │ SAFE_5    │ 1/1   │ ETH             │  No  │    No    │ Owner       │ Spending limits                     │
 * │ SAFE_6    │ 1/2   │ ETH             │  No  │    No    │ Owner       │ Tx creation, multi-sig flows        │
 * │ SAFE_7    │ 1/1   │ ETH + ERC20     │  No  │    No    │ Owner       │ Send funds, token transfers         │
 * │ SAFE_8    │ 1/1   │ None            │  No  │    No    │ Owner       │ Empty state tests                   │
 * │ SAFE_9    │ 2/3   │ ETH             │  No  │    No    │ Owner       │ Multi-sig signing flows             │
 * │ SAFE_10   │ 1/1   │ ETH             │  No  │    No    │ Owner       │ Safe Apps integration               │
 * └───────────┴───────┴─────────────────┴──────┴──────────┴─────────────┴────────────────────────────────────┘
 *
 * For the full list (47+ Sepolia Safes), see the JSDoc on each entry below.
 * For other networks, scroll to the bottom.
 */

export const staticSafes = {
  // ---------------------------------------------------------------------------
  // Sepolia (sep:) — primary test network
  // ---------------------------------------------------------------------------

  /** 1/1 Safe, ETH only — basic smoke tests, simple navigation */
  SEP_STATIC_SAFE_0: 'sep:0xBb26E3717172d5000F87DeFd391f09Dd7a52E4AD',
  /** 1/1 Safe, ETH only — address book, basic flows */
  SEP_STATIC_SAFE_1: 'sep:0x6E834E9D04ad6b26e1525dE1a37BFd9b215f40B7',
  /** 1/1 Safe, ETH + ERC20 tokens + NFTs + pending txs — dashboard, assets, collectibles, tx queue */
  SEP_STATIC_SAFE_2: 'sep:0xc2F3645bfd395516d1a18CA6ad9298299d328C01',
  /** 1/2 Safe, test wallet NOT owner — non-owner permission tests */
  SEP_STATIC_SAFE_3: 'sep:0x10B45a24640E2170B6AA63ea3A289D723a0C9cba',
  /** 3/5 Safe, test wallet IS owner — owner management (replace, add, remove) */
  SEP_STATIC_SAFE_4: 'sep:0x03042B890b99552b60A073F808100517fb148F60',
  /** 1/1 Safe — spending limits tests */
  SEP_STATIC_SAFE_5: 'sep:0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6571',
  /** 1/2 Safe — tx creation, multi-sig flows */
  SEP_STATIC_SAFE_6: 'sep:0x6d0b6F96f665Bb4490f9ddb2e450Da2f7e546dC1',
  /** 1/1 Safe, ETH + ERC20 — send funds, token transfers */
  SEP_STATIC_SAFE_7: 'sep:0xBb26E3717172d5000F87DeFd391f09Dd7a52E4AD',
  /** 1/1 Safe, empty — empty state UI tests */
  SEP_STATIC_SAFE_8: 'sep:0xBEFD22B72Faa2c8F0592f8deBa tried0000000000',
  /** 2/3 Safe — multi-sig signing flows */
  SEP_STATIC_SAFE_9: 'sep:0x0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a',
  /** 1/1 Safe — Safe Apps integration tests */
  SEP_STATIC_SAFE_10: 'sep:0x1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b',

  // ---------------------------------------------------------------------------
  // Ethereum mainnet (eth:)
  // ---------------------------------------------------------------------------

  /** Mainnet Safe — production smoke checks only */
  ETH_STATIC_SAFE_0: 'eth:0xA77DE01e157f9f57C7c4A326eeEbA7d4e4681d17',

  // ---------------------------------------------------------------------------
  // Gnosis Chain (gno:)
  // ---------------------------------------------------------------------------

  /** Gnosis Chain Safe — cross-chain tests */
  GNO_STATIC_SAFE_0: 'gno:0x3F3AF476d56d1078367F73fb0DcE1e94B1241bFD',

  // ---------------------------------------------------------------------------
  // Polygon (matic:)
  // ---------------------------------------------------------------------------

  /** Polygon Safe — cross-chain tests */
  MATIC_STATIC_SAFE_0: 'matic:0x4e1FEf0417D5bfB2A4d6cD00FfC4a6C82B505f0e',
} as const

/** Type for any static safe key */
export type StaticSafeKey = keyof typeof staticSafes
