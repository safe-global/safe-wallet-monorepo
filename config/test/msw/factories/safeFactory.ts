import { faker } from '@faker-js/faker'

/**
 * Safe mock data factory
 *
 * Generates deterministic Safe-related mock data for Storybook stories.
 * Use seeded faker for reproducible data in visual tests.
 */

export type MockSafeOwner = {
  value: string
  name?: string | null
  logoUri?: string | null
}

export type MockSafeInfo = {
  address: string
  nonce: number
  threshold: number
  owners: string[]
  masterCopy: string
  modules: string[]
  fallbackHandler: string
  guard: string
  version: string
}

export type MockMasterCopy = {
  address: string
  version: string
}

// Common Safe contract addresses
export const SAFE_MASTER_COPIES = {
  '1.3.0': '0xd9Db270c1B5E3Bd161E8c8503c55cEFDDe8E6766',
  '1.4.1': '0x6851D6fDFAfD08c0EF60ac1b9c90E5dE6247cEAC',
} as const

export const FALLBACK_HANDLER = '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4'

/**
 * Create a deterministic Ethereum address
 */
export const createMockAddress = (seed?: number): string => {
  if (seed !== undefined) {
    faker.seed(seed)
  }
  return faker.finance.ethereumAddress()
}

/**
 * Create a mock Safe owner
 */
export const createMockOwner = (overrides?: Partial<MockSafeOwner>): MockSafeOwner => ({
  value: createMockAddress(),
  name: null,
  logoUri: null,
  ...overrides,
})

/**
 * Create multiple mock owners
 */
export const createMockOwners = (count: number, seed?: number): string[] => {
  if (seed !== undefined) {
    faker.seed(seed)
  }
  return Array.from({ length: count }, () => faker.finance.ethereumAddress())
}

/**
 * Create a mock Safe info object
 */
export const createMockSafeInfo = (overrides?: Partial<MockSafeInfo>): MockSafeInfo => {
  const owners = overrides?.owners ?? createMockOwners(3)
  const threshold = overrides?.threshold ?? Math.min(2, owners.length)

  return {
    address: createMockAddress(),
    nonce: 0,
    threshold,
    owners,
    masterCopy: SAFE_MASTER_COPIES['1.3.0'],
    modules: [],
    fallbackHandler: FALLBACK_HANDLER,
    guard: '0x0000000000000000000000000000000000000000',
    version: '1.3.0',
    ...overrides,
  }
}

/**
 * Create a mock master copy
 */
export const createMockMasterCopy = (version: keyof typeof SAFE_MASTER_COPIES = '1.3.0'): MockMasterCopy => ({
  address: SAFE_MASTER_COPIES[version],
  version,
})

/**
 * Create all available master copies
 */
export const createAllMasterCopies = (): MockMasterCopy[] =>
  Object.entries(SAFE_MASTER_COPIES).map(([version, address]) => ({
    address,
    version,
  }))

/**
 * Preset Safe configurations for common scenarios
 */
export const safeMocks = {
  /** Standard 2-of-3 multisig */
  standard: () =>
    createMockSafeInfo({
      threshold: 2,
      owners: createMockOwners(3, 1),
    }),

  /** Single owner Safe (1-of-1) */
  singleOwner: () =>
    createMockSafeInfo({
      threshold: 1,
      owners: createMockOwners(1, 2),
    }),

  /** High security Safe (3-of-5) */
  highSecurity: () =>
    createMockSafeInfo({
      threshold: 3,
      owners: createMockOwners(5, 3),
    }),

  /** Safe with modules enabled */
  withModules: () =>
    createMockSafeInfo({
      modules: [createMockAddress(100), createMockAddress(101)],
    }),

  /** Safe with guard enabled */
  withGuard: () =>
    createMockSafeInfo({
      guard: createMockAddress(200),
    }),

  /** Legacy Safe (v1.3.0) */
  legacy: () =>
    createMockSafeInfo({
      masterCopy: SAFE_MASTER_COPIES['1.3.0'],
      version: '1.3.0',
    }),

  /** Latest Safe (v1.4.1) */
  latest: () =>
    createMockSafeInfo({
      masterCopy: SAFE_MASTER_COPIES['1.4.1'],
      version: '1.4.1',
    }),
}
