/**
 * Static test Safes — pre-created on testnets and mainnets.
 * Shared across all read-only tests. Never mutated by tests.
 *
 * Source of truth: copied from cypress/fixtures/safes/static.js
 * Both frameworks share the same test Safes on Sepolia staging.
 *
 * === AI AGENT INSTRUCTIONS ===
 * When writing a new test, DO NOT ask the human which Safe to use.
 * Instead, scan this lookup table and select the Safe that matches
 * your test's data requirements. If no existing Safe fits, flag it
 * as a test data gap — do not hardcode a new address.
 *
 * Selection algorithm:
 * 1. What chain does the test need? → Filter by network prefix
 * 2. What data does the test need? → Match against the JSDoc comments below
 * 3. Does the test mutate state? → If yes, DO NOT use a static Safe.
 *    Static Safes are read-only shared resources.
 * 4. Does the test need wallet connection? → Check if test wallet is owner
 * 5. Pick the SIMPLEST Safe that satisfies requirements — don't use a
 *    feature-rich Safe for a basic smoke test.
 */

export const staticSafes = {
  // ---------------------------------------------------------------------------
  // Sepolia (sep:) — primary test network
  // ---------------------------------------------------------------------------

  /** Create Safe CF and multichain testing */
  SEP_STATIC_SAFE_0: 'sep:0x926186108f74dB20BFeb2b6c888E523C78cb7E00',
  /** Swaps and swap history testing */
  SEP_STATIC_SAFE_1: 'sep:0x03042B890b99552b60A073F808100517fb148F60',
  /** Dashboard, assets, tokens, and NFTs testing */
  SEP_STATIC_SAFE_2: 'sep:0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415',
  /** Owner management and load safe testing */
  SEP_STATIC_SAFE_3: 'sep:0x33C4AA5729D91FfB3B87AEf8a324bb6304Fb905c',
  /** Load safe and owner management testing */
  SEP_STATIC_SAFE_4: 'sep:0xBb26E3717172d5000F87DeFd391994f789D80aEB',
  /** Address book and CSV import testing */
  SEP_STATIC_SAFE_5: 'sep:0x6E834E9D04ad6b26e1525dE1a37BFd9b215f40B7',
  /** Create transaction and ENS testing (e2etestsafe.eth) */
  SEP_STATIC_SAFE_6: 'sep:0xBf30F749FC027a5d79c4710D988F0D3C8e217A4F',
  /** Queue delete/reject testing */
  SEP_STATIC_SAFE_7: 'sep:0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb',
  /** Spending limits and transaction notes testing */
  SEP_STATIC_SAFE_8: 'sep:0x9190cc22D592dDcf396Fa616ce84a9978fD96Fc9',
  /** Sidebar testing */
  SEP_STATIC_SAFE_9: 'sep:0x98705770aF3b18db0a64597F6d4DCe825915fec0',
  SEP_STATIC_SAFE_9_SHORT: '0x9870...fec0',
  /** Messages (onchain/offchain) testing */
  SEP_STATIC_SAFE_10: 'sep:0xc2F3645bfd395516d1a18CA6ad9298299d328C01',
  /** Sidebar non-owner testing */
  SEP_STATIC_SAFE_11: 'sep:0x10B45a24640E2170B6AA63ea3A289D723a0C9cba',
  /** Dashboard testing */
  SEP_STATIC_SAFE_12: 'sep:0xFFfaC243A24EecE6553f0Da278322aCF1Fb6CeF1',
  /** Recovery, owner management, and data import/export testing */
  SEP_STATIC_SAFE_13: 'sep:0x027bBe128174F0e5e5d22ECe9623698E01cd3970',
  /** Dashboard testing */
  SEP_STATIC_SAFE_14: 'sep:0xe41D568F5040FD9adeE8B64200c6B7C363C68c41',
  /** Transaction history, NFTs, messages, and spending limits testing */
  SEP_STATIC_SAFE_23: 'sep:0x589d862CE2d519d5A862066bB923da0564c3D2EA',
  /** Add owner testing */
  SEP_STATIC_SAFE_24: 'sep:0x49DC5764961DA4864DC5469f16BC68a0F765f2F2',
  /** Replace owner testing */
  SEP_STATIC_SAFE_25: 'sep:0x4ECFAa2E8cb4697bCD27bdC9Ce3E16f03F73124F',
  /** Transaction notes and messages testing */
  SEP_STATIC_SAFE_26: 'sep:0x755428b02A458eD17fa93c86F6C3a2046F2c4C3C',
  /** TWAP and swap testing */
  SEP_STATIC_SAFE_27: 'sep:0xC97FCf0B8890a5a7b1a1490d44Dc9EbE3cE04884',
  /** Swaps testing */
  SEP_STATIC_SAFE_30: 'sep:0x2687E6643E189c1245EA8419e5e427809136021F',
  /** Proposers testing */
  SEP_STATIC_SAFE_31: 'sep:0x09725D3c2f9bE905F8f9f1b11a771122cf9C9f35',
  /** Proposers testing */
  SEP_STATIC_SAFE_32: 'sep:0x698C8D95D7B6b0B50338c2885d9583737546768f',
  /** Proposers testing */
  SEP_STATIC_SAFE_33: 'sep:0x597D644b1F2b66B84F2C56f0D40D0314E8D5895b',
  /** Queue transaction testing */
  SEP_STATIC_SAFE_34: 'sep:0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2',
  /** Transaction details queue and spaces testing */
  SEP_STATIC_SAFE_35: 'sep:0xc36A530ccD728d36a654ccedEB7994473474C018',
  /** Transaction details create tx testing */
  SEP_STATIC_SAFE_36: 'sep:0xD9BD8a5F97A003f948d684695667BB8Ff9F3d61E',
  /** Queue reject testing */
  SEP_STATIC_SAFE_37: 'sep:0x4B8A8Ca9F0002a850CB2c81b205a6D7429a22DEe',
  /** Transaction history filter testing */
  SEP_STATIC_SAFE_38: 'sep:0x30aeC11779d29dB096C434D4e72E77276EB01BdE',
  /** Nested safes testing */
  SEP_STATIC_SAFE_39: 'sep:0xAD5e4a366cc840120701384fca4Ec9b8bEb47cAD',
  /** Nested safes testing */
  SEP_STATIC_SAFE_40: 'sep:0x22e5093F4A75c2E99A8EcabfBF8c5c7fDcaDCf9d',
  /** Nested safes testing */
  SEP_STATIC_SAFE_41: 'sep:0xE5577b9E75F94C4a900E74F63F79A7968e812208',
  /** Mass payouts testing */
  SEP_STATIC_SAFE_42: 'sep:0x7AaE77F475E718AdD032C7665427C6d4e6104D3c',
  /** Transaction builder testing */
  SEP_STATIC_SAFE_43: 'sep:0xC5AaBf061f2412F9D84585755dc517EF040becF9',
  /** Sidebar testing (prodhealthcheck) */
  SEP_STATIC_SAFE_44: 'sep:0x8A3faB996b721d68357B42eD0D6328eBE6113e00',
  /** Nested safes review and fund asset testing */
  SEP_STATIC_SAFE_45: 'sep:0x5958B92f412408bF12Bbc8638d524ebe5878E795',
  /** Nested safes curation testing (hide/show) — has 8 nested safes, 2 suspicious */
  SEP_STATIC_SAFE_46: 'sep:0xdC269A6415d7802B232B59034e325c9D1c8fB3E8',
  /** Spending limits AllowanceModule address verification */
  SEP_STATIC_SAFE_47: 'sep:0xED6ee29286c4791B55129eA2570d2e3097B067De',

  // ---------------------------------------------------------------------------
  // Ethereum mainnet (eth:)
  // ---------------------------------------------------------------------------

  /** Recovery and balances testing */
  ETH_STATIC_SAFE_15: 'eth:0xfF501B324DC6d78dC9F983f140B9211c3EdB4dc7',
  /** Outdated official mastercopy (Info, "Update" CTA) */
  ETH_STATIC_SAFE_OUTDATED_MASTERCOPY: 'eth:0x1230B3d59858296A31053C1b8562Ecf89A2f888b',

  // ---------------------------------------------------------------------------
  // Gnosis Chain (gno:)
  // ---------------------------------------------------------------------------

  /** Recovery testing */
  GNO_STATIC_SAFE_16: 'gno:0xB8d760a90a5ed54D3c2b3EFC231277e99188642A',

  // ---------------------------------------------------------------------------
  // Polygon (matic:)
  // ---------------------------------------------------------------------------

  /** Recovery module testing */
  MATIC_STATIC_SAFE_17: 'matic:0x6D04edC44F7C88faa670683036edC2F6FC10b86e',
  /** Multichain testing (primary CF safe) — ⚠️ avoid modifying state */
  MATIC_STATIC_SAFE_28: 'matic:0xC96ee38f5A73C8A70b565CB8EA938D2aF913ee3B',
  /** Available for general testing */
  MATIC_STATIC_SAFE_29: 'matic:0x5E9242FD52c4c4A60d874E8ff4Ba25657dd6e551',
  /** Safe Shield tests */
  MATIC_STATIC_SAFE_30: 'matic:0x65e1Ff7e0901055B3bea7D8b3AF457a659714013',
  /** Unsupported but migratable in-app (Warning, "Migrate" CTA) */
  MATIC_STATIC_SAFE_31: 'matic:0x0b268DC6D1DfF21CaEb161c7aF5cEc3093057082',
  /** Unsupported not migratable in-app (Warning, "Get CLI" CTA) */
  MATIC_STATIC_SAFE_32: 'matic:0xc8D6C3f866597a63780fdEC4C4Cb08B5C19CDb60',
  /** Positions static safe */
  MATIC_STATIC_SAFE_33: 'matic:0xc1f4652866ddB3811adcd3418c13eF640e88E1f6',
  /** Spending limits AllowanceModule address verification */
  MATIC_STATIC_SAFE_34: 'matic:0xED6ee29286c4791B55129eA2570d2e3097B067De',

  // ---------------------------------------------------------------------------
  // BNB Chain (bnb:)
  // ---------------------------------------------------------------------------

  /** BNB Chain testing */
  BNB_STATIC_SAFE_18: 'bnb:0x1D28a316431bAFf410Fe53398c6C5BD566032Eec',

  // ---------------------------------------------------------------------------
  // Aurora (aurora:)
  // ---------------------------------------------------------------------------

  /** Aurora testing */
  AURORA_STATIC_SAFE_19: 'aurora:0xCEA454dD3d76Da856E72C3CBaDa8ee6A789aD167',

  // ---------------------------------------------------------------------------
  // Avalanche (avax:)
  // ---------------------------------------------------------------------------

  /** Avalanche testing */
  AVAX_STATIC_SAFE_20: 'avax:0x480e5A3E90a3fF4a16AECCB5d638fAba96a15c28',

  // ---------------------------------------------------------------------------
  // Linea (linea:)
  // ---------------------------------------------------------------------------

  /** Linea testing */
  LINEA_STATIC_SAFE_21: 'linea:0x95934e67299E0B3DD277907acABB512802f3536E',

  // ---------------------------------------------------------------------------
  // zkSync (zksync:)
  // ---------------------------------------------------------------------------

  /** zkSync testing */
  ZKSYNC_STATIC_SAFE_22: 'zksync:0x49136c0270c5682FFbb38Cb29Ecf0563b2E1F9f6',
  /** zkSync testing */
  ZKSYNC_STATIC_SAFE_29: 'zksync:0x950e07c80d7Bb754CcD84afE2b7751dc7Fd65D1f',
} as const

/** Type for any static safe key */
export type StaticSafeKey = keyof typeof staticSafes
