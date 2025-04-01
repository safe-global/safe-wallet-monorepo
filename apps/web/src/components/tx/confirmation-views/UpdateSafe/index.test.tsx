import type { ChainInfo, TransactionData } from '@safe-global/safe-gateway-typescript-sdk'
import { _UpdateSafe as UpdateSafe } from './index'
import { render } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { Gnosis_safe__factory } from '@safe-global/utils/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.1.1'
import { getSafeMigrationDeployment, getSafeSingletonDeployment } from '@safe-global/safe-deployments'
import { Safe_migration__factory } from '@safe-global/utils/types/contracts'
import { faker } from '@faker-js/faker'

const chain = {
  recommendedMasterCopyVersion: '1.4.1',
} as ChainInfo

const Safe_111_interface = Gnosis_safe__factory.createInterface()

const warningText = 'This upgrade will invalidate all queued transactions!'

const unknownTargetWarningText =
  'The target contract for this upgrade is unknown. Verify the transaction data and the target contract address before executing this transaction.'

describe('Container', () => {
  it('renders correctly with a queue warning', async () => {
    const newSingleton = getSafeSingletonDeployment({ version: '1.4.1' })?.defaultAddress!
    const safe = extendedSafeInfoBuilder().with({ version: '1.1.1' }).build()
    const txData: TransactionData = {
      operation: 0,
      to: safe.address,
      trustedDelegateCallTarget: true,
      value: '0',
      hexData: Safe_111_interface.encodeFunctionData('changeMasterCopy', [newSingleton]),
    }
    const container = render(
      <UpdateSafe
        txData={txData}
        safeInfo={{ safe, safeAddress: safe.address.value, safeLoaded: true, safeLoading: false }}
        queueSize="10+"
        chain={chain}
      />,
    )
    await expect(container.findByText(warningText)).resolves.not.toBeNull()
    expect(container.queryByText('Current version: 1.1.1')).toBeVisible()
    expect(container.queryByText('New version: 1.4.1')).toBeVisible()
  })

  it('renders correctly without a queue warning because no queue', async () => {
    const newSingleton = getSafeSingletonDeployment({ version: '1.4.1' })?.defaultAddress!
    const safe = extendedSafeInfoBuilder().with({ version: '1.1.1' }).build()
    const txData: TransactionData = {
      operation: 0,
      to: safe.address,
      trustedDelegateCallTarget: true,
      value: '0',
      hexData: Safe_111_interface.encodeFunctionData('changeMasterCopy', [newSingleton]),
    }
    const container = render(
      <UpdateSafe
        txData={txData}
        safeInfo={{ safe, safeAddress: safe.address.value, safeLoaded: true, safeLoading: false }}
        queueSize=""
        chain={chain}
      />,
    )
    await expect(container.findByText(warningText)).rejects.toThrowError(Error)
    expect(container.queryByText('Current version: 1.1.1')).toBeVisible()
    expect(container.queryByText('New version: 1.4.1')).toBeVisible()
  })

  it('renders correctly without a queue warning because of compatible Safe version', async () => {
    const migrationAddress = getSafeMigrationDeployment({ version: '1.4.1' })?.defaultAddress!
    const safe = extendedSafeInfoBuilder().with({ version: '1.3.0' }).build()
    const txData: TransactionData = {
      operation: 1,
      to: { value: migrationAddress },
      trustedDelegateCallTarget: true,
      value: '0',
      hexData: Safe_migration__factory.createInterface().encodeFunctionData('migrateSingleton'),
    }
    const container = render(
      <UpdateSafe
        txData={txData}
        safeInfo={{ safe, safeAddress: safe.address.value, safeLoaded: true, safeLoading: false }}
        queueSize="10+"
        chain={chain}
      />,
    )
    await expect(container.findByText(warningText)).rejects.toThrowError(Error)
    expect(container.queryByText('Current version: 1.3.0')).toBeVisible()
    expect(container.queryByText('New version: 1.4.1')).toBeVisible()
  })

  it('renders correctly with a unknown contract warning if the target contract is not known', async () => {
    const newSingleton = faker.finance.ethereumAddress()
    const safe = extendedSafeInfoBuilder().with({ version: '1.1.1' }).build()
    const txData: TransactionData = {
      operation: 0,
      to: safe.address,
      trustedDelegateCallTarget: true,
      value: '0',
      hexData: Safe_111_interface.encodeFunctionData('changeMasterCopy', [newSingleton]),
    }
    const container = render(
      <UpdateSafe
        txData={txData}
        safeInfo={{ safe, safeAddress: safe.address.value, safeLoaded: true, safeLoading: false }}
        queueSize="0"
        chain={chain}
      />,
    )
    expect(container.queryByText('Current version: 1.1.1')).toBeVisible()
    expect(container.queryAllByText('Unknown contract')).toHaveLength(2)
    expect(container.queryByText(unknownTargetWarningText)).toBeVisible()
  })
})
