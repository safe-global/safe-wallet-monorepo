import type { ChainInfo, TransactionData } from '@safe-global/safe-gateway-typescript-sdk'
import { _UpdateSafe as UpdateSafe } from './index'
import { render } from '@/tests/test-utils'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { Gnosis_safe__factory } from '@/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.1.1'
import { getSafeMigrationDeployment, getSafeSingletonDeployment } from '@safe-global/safe-deployments'
import { Safe_migration__factory } from '@/types/contracts'

const chain = {
  recommendedMasterCopyVersion: '1.4.1',
} as ChainInfo

const warningText = 'This upgrade will invalidate all queued transactions!'

describe('Container', () => {
  it('renders correctly with a queue warning', async () => {
    const newSingleton = getSafeSingletonDeployment({ version: '1.4.1' })?.defaultAddress!
    const Safe_111_interface = Gnosis_safe__factory.createInterface()
    const safe = safeInfoBuilder().with({ version: '1.1.1' }).build()
    const txData: TransactionData = {
      operation: 0,
      to: safe.address,
      trustedDelegateCallTarget: true,
      value: '0',
      hexData: Safe_111_interface.encodeFunctionData('changeMasterCopy', [newSingleton]),
    }
    const container = render(<UpdateSafe txData={txData} safe={safe} queueSize="10+" chain={chain} />)
    await expect(container.findByText(warningText)).resolves.not.toBeNull()
  })

  it('renders correctly without a queue warning because no queue', async () => {
    const newSingleton = getSafeSingletonDeployment({ version: '1.4.1' })?.defaultAddress!
    const Safe_111_interface = Gnosis_safe__factory.createInterface()
    const safe = safeInfoBuilder().with({ version: '1.1.1' }).build()
    const txData: TransactionData = {
      operation: 0,
      to: safe.address,
      trustedDelegateCallTarget: true,
      value: '0',
      hexData: Safe_111_interface.encodeFunctionData('changeMasterCopy', [newSingleton]),
    }
    const container = render(<UpdateSafe txData={txData} safe={safe} queueSize="" chain={chain} />)
    await expect(container.findByText(warningText)).rejects.toThrowError(Error)
  })

  it('renders correctly without a queue warning because of compatible Safe version', async () => {
    const migrationAddress = getSafeMigrationDeployment({ version: '1.4.1' })?.defaultAddress!
    const safe = safeInfoBuilder().with({ version: '1.3.0' }).build()
    const txData: TransactionData = {
      operation: 1,
      to: { value: migrationAddress },
      trustedDelegateCallTarget: true,
      value: '0',
      hexData: Safe_migration__factory.createInterface().encodeFunctionData('migrateSingleton'),
    }
    const container = render(<UpdateSafe txData={txData} safe={safe} queueSize="10+" chain={chain} />)
    await expect(container.findByText(warningText)).rejects.toThrowError(Error)
  })
})
