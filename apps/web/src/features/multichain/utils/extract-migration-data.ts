import type { TransactionData } from '@safe-global/safe-gateway-typescript-sdk'
import { Safe_migration__factory } from '@/types/contracts'
import { sameAddress } from '@/utils/addresses'
import { getSafeMigrationDeployment } from '@safe-global/safe-deployments'

export const isMigrateL2SingletonCall = (txData: TransactionData): boolean => {
  // We always use the 1.4.1 version for this contract as it is only deployyed for 1.4.1 Safes
  const safeMigrationDeployment = getSafeMigrationDeployment({ version: '1.4.1' })
  const safeMigrationAddress = safeMigrationDeployment?.defaultAddress
  const safeMigrationInterface = Safe_migration__factory.createInterface()

  return (
    txData.hexData !== undefined &&
    txData.hexData.startsWith(safeMigrationInterface.getFunction('migrateL2Singleton').selector) &&
    sameAddress(txData.to.value, safeMigrationAddress)
  )
}
