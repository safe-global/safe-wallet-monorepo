import { type ChainInfo, type TransactionData } from '@safe-global/safe-gateway-typescript-sdk'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import { Safe_migration__factory } from '@/types/contracts'
import { faker } from '@faker-js/faker'

import { createUpdateMigration, isMigrateL2SingletonCall } from '../safe-migrations'
import { getSafeMigrationDeployment } from '@safe-global/safe-deployments'

jest.mock('@/services/tx/tx-sender/sdk')

const SafeMigrationInterface = Safe_migration__factory.createInterface()
const safeMigrationAddress = getSafeMigrationDeployment({ version: '1.4.1' })?.defaultAddress

describe('isMigrateL2SingletonCall', () => {
  it('should return false for wrong data', () => {
    expect(
      isMigrateL2SingletonCall({
        hexData: faker.string.hexadecimal({ length: 64 }),
        to: { value: safeMigrationAddress },
      } as TransactionData),
    ).toBeFalsy()
  })

  it('should return false for migrateL2 call to wrong contract', () => {
    expect(
      isMigrateL2SingletonCall({
        hexData: SafeMigrationInterface.encodeFunctionData('migrateL2Singleton'),
        to: { value: faker.finance.ethereumAddress() },
      } as TransactionData),
    ).toBeFalsy()
  })

  it('should return true for migrateL2 call to correct contract', () => {
    expect(
      isMigrateL2SingletonCall({
        hexData: SafeMigrationInterface.encodeFunctionData('migrateL2Singleton'),
        to: { value: safeMigrationAddress },
      } as TransactionData),
    ).toBeTruthy()
  })

  it('should return false for null data', () => {
    expect(
      isMigrateL2SingletonCall({
        hexData: undefined,
        to: { value: safeMigrationAddress },
        operation: 0,
        trustedDelegateCallTarget: true,
      } as TransactionData),
    ).toBeFalsy()
  })
})

describe('createUpdateMigration', () => {
  const mockChain = {
    chainId: '1',
    l2: false,
    recommendedMasterCopyVersion: '1.4.1',
  } as unknown as ChainInfo

  const mockChainOld = {
    chainId: '1',
    l2: false,
    recommendedMasterCopyVersion: '1.3.0',
  } as unknown as ChainInfo

  it('should create a migration transaction for L1 chain', () => {
    const result = createUpdateMigration(mockChain, '1.3.0')

    expect(result).toEqual({
      operation: OperationType.DelegateCall,
      data: '0xed007fc6',
      to: '0x526643F69b81B008F46d95CD5ced5eC0edFFDaC6',
      value: '0',
    })
  })

  it('should create a migration transaction for L2 chain', () => {
    const l2Chain = { ...mockChain, chainId: '137', l2: true }
    const result = createUpdateMigration(l2Chain, '1.3.0+L2')

    expect(result).toEqual({
      operation: OperationType.DelegateCall,
      data: '0x68cb3d94',
      to: '0x526643F69b81B008F46d95CD5ced5eC0edFFDaC6',
      value: '0',
    })
  })

  it('should throw an error if deployment is not found', () => {
    expect(() => createUpdateMigration(mockChainOld, '1.1.1')).toThrow('Migration deployment not found')
  })

  it('should overwrite fallback handler if it is the default one', () => {
    const result = createUpdateMigration(mockChain, '1.3.0', '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4') // 1.3.0 compatibility fallback handler

    expect(result).toEqual({
      operation: OperationType.DelegateCall,
      data: '0xed007fc6',
      to: '0x526643F69b81B008F46d95CD5ced5eC0edFFDaC6',
      value: '0',
    })
  })

  it('should overwrite L2 fallback handler if it is the default one', () => {
    const l2Chain = { ...mockChain, chainId: '137', l2: true }
    const result = createUpdateMigration(l2Chain, '1.3.0+L2', '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4') // 1.3.0 compatibility fallback handler

    expect(result).toEqual({
      operation: OperationType.DelegateCall,
      data: '0x68cb3d94',
      to: '0x526643F69b81B008F46d95CD5ced5eC0edFFDaC6',
      value: '0',
    })
  })

  it('should NOT overwrite a custom fallback handler', () => {
    const result = createUpdateMigration(mockChain, '1.3.0', '0x526643F69b81B008F46d95CD5ced5eC0edFFDaC6')

    expect(result).toEqual({
      operation: OperationType.DelegateCall,
      data: '0xf6682ab0',
      to: '0x526643F69b81B008F46d95CD5ced5eC0edFFDaC6',
      value: '0',
    })
  })
})
