import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { OperationType } from '@safe-global/types-kit'
import { Safe_migration__factory } from '@safe-global/utils/types/contracts'
import { faker } from '@faker-js/faker'

import { createUpdateMigration, isSafeMigrationCall } from '../safe-migrations'

jest.mock('@/services/tx/tx-sender/sdk')

const SafeMigrationInterface = Safe_migration__factory.createInterface()

const CANONICAL_MIGRATION = '0x526643F69b81B008F46d95CD5ced5eC0edFFDaC6'
const ZKSYNC_MIGRATION = '0x817756C6c555A94BCEE39eB5a102AbC1678b09A7'

const SELECTORS = {
  migrateSingleton: '0xf6682ab0',
  migrateL2Singleton: '0x07f464a4',
  migrateWithFallbackHandler: '0xed007fc6',
  migrateL2WithFallbackHandler: '0x68cb3d94',
}

// Official 1.3.0 compatibility fallback handler — a default handler that gets reset
const DEFAULT_FALLBACK_HANDLER = '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4'
const CUSTOM_FALLBACK_HANDLER = '0x1234567890123456789012345678901234567890'
// Official L2 1.4.1 zksync-variant singleton
const OFFICIAL_L2_141_ZKSYNC = '0x610fcA2e0279Fa1F8C00c8c2F71dF522AD469380'

describe('isSafeMigrationCall', () => {
  it('returns false for unrelated calldata to the migration contract', () => {
    expect(
      isSafeMigrationCall({
        hexData: faker.string.hexadecimal({ length: 64 }),
        to: { value: CANONICAL_MIGRATION },
      } as TransactionData),
    ).toBe(false)
  })

  it('returns false for a migrate call to a different contract', () => {
    expect(
      isSafeMigrationCall({
        hexData: SafeMigrationInterface.encodeFunctionData('migrateL2Singleton'),
        to: { value: faker.finance.ethereumAddress() },
      } as TransactionData),
    ).toBe(false)
  })

  it('returns true for a migrate call to the canonical migration contract', () => {
    expect(
      isSafeMigrationCall({
        hexData: SafeMigrationInterface.encodeFunctionData('migrateL2Singleton'),
        to: { value: CANONICAL_MIGRATION },
      } as TransactionData),
    ).toBe(true)
  })

  it('returns true for a migrate call to the zksync migration variant', () => {
    expect(
      isSafeMigrationCall({
        hexData: SafeMigrationInterface.encodeFunctionData('migrateL2Singleton'),
        to: { value: ZKSYNC_MIGRATION },
      } as TransactionData),
    ).toBe(true)
  })

  it('recognises every migrate method, not only migrateL2Singleton', () => {
    for (const selector of Object.values(SELECTORS)) {
      expect(
        isSafeMigrationCall({
          hexData: selector,
          to: { value: CANONICAL_MIGRATION },
        } as TransactionData),
      ).toBe(true)
    }
  })

  it('returns false for null data', () => {
    expect(
      isSafeMigrationCall({
        hexData: undefined,
        to: { value: CANONICAL_MIGRATION },
        operation: 0,
      } as TransactionData),
    ).toBe(false)
  })
})

describe('createUpdateMigration', () => {
  const l1Chain = { chainId: '1', l2: false, zk: false } as unknown as Chain
  const l2Chain = { chainId: '137', l2: true, zk: false } as unknown as Chain
  const zkChain = { chainId: '324', l2: true, zk: true } as unknown as Chain

  it('targets the canonical 1.4.1 singleton via migrateWithFallbackHandler on an L1 chain (default handler)', () => {
    const result = createUpdateMigration(l1Chain, '1.3.0')

    expect(result).toEqual({
      operation: OperationType.DelegateCall,
      data: SELECTORS.migrateWithFallbackHandler,
      to: CANONICAL_MIGRATION,
      value: '0',
    })
  })

  it('keeps a custom fallback handler on an L1 chain (migrateSingleton) and targets the canonical singleton', () => {
    const result = createUpdateMigration(l1Chain, '1.3.0', CUSTOM_FALLBACK_HANDLER)

    expect(result.data).toBe(SELECTORS.migrateSingleton)
    expect(result.to).toBe(CANONICAL_MIGRATION)
  })

  it('resets a default fallback handler on an L1 chain (migrateWithFallbackHandler)', () => {
    const result = createUpdateMigration(l1Chain, '1.3.0', DEFAULT_FALLBACK_HANDLER)

    expect(result.data).toBe(SELECTORS.migrateWithFallbackHandler)
    expect(result.to).toBe(CANONICAL_MIGRATION)
  })

  it('targets the canonical 1.4.1 L2 singleton via migrateL2WithFallbackHandler on an L2 chain', () => {
    const result = createUpdateMigration(l2Chain, '1.3.0+L2')

    expect(result).toEqual({
      operation: OperationType.DelegateCall,
      data: SELECTORS.migrateL2WithFallbackHandler,
      to: CANONICAL_MIGRATION,
      value: '0',
    })
  })

  it('keeps a custom fallback handler on an L2 chain (migrateL2Singleton)', () => {
    const result = createUpdateMigration(l2Chain, '1.3.0+L2', CUSTOM_FALLBACK_HANDLER)

    expect(result.data).toBe(SELECTORS.migrateL2Singleton)
    expect(result.to).toBe(CANONICAL_MIGRATION)
  })

  it('resets a default L2 fallback handler (migrateL2WithFallbackHandler)', () => {
    const result = createUpdateMigration(l2Chain, '1.3.0+L2', DEFAULT_FALLBACK_HANDLER)

    expect(result.data).toBe(SELECTORS.migrateL2WithFallbackHandler)
    expect(result.to).toBe(CANONICAL_MIGRATION)
  })

  it('targets the zksync variant (never the canonical defaultAddress) on a zkEVM chain', () => {
    const result = createUpdateMigration(zkChain, '1.4.1', CUSTOM_FALLBACK_HANDLER)

    expect(result.to).toBe(ZKSYNC_MIGRATION)
    expect(result.to).not.toBe(CANONICAL_MIGRATION)
    expect(result.data).toBe(SELECTORS.migrateL2Singleton)
    expect(result.operation).toBe(OperationType.DelegateCall)
  })

  it('resolves the zksync variant from an official zksync master copy even without the chain zk flag', () => {
    const zkChainNoFlag = { chainId: '324', l2: true, zk: false } as unknown as Chain
    const result = createUpdateMigration(zkChainNoFlag, '1.4.1', CUSTOM_FALLBACK_HANDLER, OFFICIAL_L2_141_ZKSYNC)

    expect(result.to).toBe(ZKSYNC_MIGRATION)
  })

  it('resolves an official eip155 master copy to the canonical migration address without throwing', () => {
    // SafeMigration ships no eip155 variant. Using an unregistered chain means the
    // lookup cannot fall back to networkAddresses[0], so an un-collapsed 'eip155'
    // deployment type would resolve to undefined and throw. It must collapse to canonical.
    const OFFICIAL_L2_130_EIP155 = '0xfb1bffC9d739B8D520DaF37dF666da4C687191EA'
    const unregisteredL2Chain = { chainId: '111222333', l2: true, zk: false } as unknown as Chain

    expect(() => createUpdateMigration(unregisteredL2Chain, '1.3.0', undefined, OFFICIAL_L2_130_EIP155)).not.toThrow()

    const result = createUpdateMigration(unregisteredL2Chain, '1.3.0', undefined, OFFICIAL_L2_130_EIP155)
    expect(result.to).toBe(CANONICAL_MIGRATION)
  })
})
