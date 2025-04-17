import { faker } from '@faker-js/faker'
import { getMultiSendCallOnlyDeployment, getSafeSingletonDeployment } from '@safe-global/safe-deployments'
import { Interface } from 'ethers'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { encodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils/transactions/utils'

import { safeInfoBuilder } from '@/tests/builders/safe'
import { getRecoveredSafeInfo } from '../transaction-list'
import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'

describe('getRecoveredSafeInfo', () => {
  describe('non-MultiSend', () => {
    it('returns the added owner and new threshold', () => {
      const safe = safeInfoBuilder().with({ chainId: '5' }).build()

      const safeDeployment = getSafeSingletonDeployment({ network: safe.chainId, version: safe.version ?? undefined })
      const safeInterface = new Interface(safeDeployment!.abi)

      const newOwner = checksumAddress(faker.finance.ethereumAddress())
      const newThreshold = safe.threshold + 1

      const transaction = {
        to: safe.address.value,
        value: '0',
        data: safeInterface.encodeFunctionData('addOwnerWithThreshold', [newOwner, newThreshold]),
      }

      expect(getRecoveredSafeInfo(safe, transaction)).toStrictEqual({
        ...safe,
        owners: [...safe.owners, { value: newOwner }],
        threshold: newThreshold,
      })
    })

    it('returns without an owner and new threshold', () => {
      const safe = safeInfoBuilder().with({ chainId: '5' }).build()

      const safeDeployment = getSafeSingletonDeployment({ network: safe.chainId, version: safe.version ?? undefined })
      const safeInterface = new Interface(safeDeployment!.abi)

      const newThreshold = safe.threshold - 1

      const transaction = {
        to: safe.address.value,
        value: '0',
        data: safeInterface.encodeFunctionData('removeOwner', [SENTINEL_ADDRESS, safe.owners[0].value, newThreshold]),
      }

      expect(getRecoveredSafeInfo(safe, transaction)).toStrictEqual({
        ...safe,
        owners: safe.owners.slice(1),
        threshold: newThreshold,
      })
    })

    it('returns a swapped owner', () => {
      const safe = safeInfoBuilder().with({ chainId: '5' }).build()

      const safeDeployment = getSafeSingletonDeployment({ network: safe.chainId, version: safe.version ?? undefined })
      const safeInterface = new Interface(safeDeployment!.abi)

      const newOwner = checksumAddress(faker.finance.ethereumAddress())

      const transaction = {
        to: safe.address.value,
        value: '0',
        data: safeInterface.encodeFunctionData('swapOwner', [SENTINEL_ADDRESS, safe.owners[0].value, newOwner]),
      }

      expect(getRecoveredSafeInfo(safe, transaction)).toStrictEqual({
        ...safe,
        owners: [{ value: newOwner }, ...safe.owners.slice(1)],
      })
    })

    it('returns a new threshold', () => {
      const safe = safeInfoBuilder().with({ chainId: '5' }).build()

      const safeDeployment = getSafeSingletonDeployment({ network: safe.chainId, version: safe.version ?? undefined })
      const safeInterface = new Interface(safeDeployment!.abi)

      const newThreshold = safe.threshold - 1

      const transaction = {
        to: safe.address.value,
        value: '0',
        data: safeInterface.encodeFunctionData('changeThreshold', [newThreshold]),
      }

      expect(getRecoveredSafeInfo(safe, transaction)).toStrictEqual({
        ...safe,
        threshold: newThreshold,
      })
    })

    it('otherwise throws', () => {
      const safe = safeInfoBuilder().with({ chainId: '5' }).build()

      const transaction = {
        to: safe.address.value,
        value: '0',
        data: '0x',
      }

      expect(() => getRecoveredSafeInfo(safe, transaction)).toThrowError('Unexpected transaction')
    })
  })

  it('handles a MultiSend batch of the above', () => {
    const safe = safeInfoBuilder()
      .with({
        chainId: '5',
        owners: [
          { value: checksumAddress(faker.finance.ethereumAddress()) },
          { value: checksumAddress(faker.finance.ethereumAddress()) },
          { value: checksumAddress(faker.finance.ethereumAddress()) },
        ],
        threshold: 2,
      })
      .build()

    const safeDeployment = getSafeSingletonDeployment({ network: safe.chainId, version: safe.version ?? undefined })
    const safeInterface = new Interface(safeDeployment!.abi)

    const multiSendDeployment = getMultiSendCallOnlyDeployment({
      network: safe.chainId,
      version: safe.version ?? undefined,
    })
    const multiSendAddress = multiSendDeployment!.networkAddresses[safe.chainId]
    const multiSendInterface = new Interface(multiSendDeployment!.abi)

    const addedOwner = checksumAddress(faker.finance.ethereumAddress())
    const removedOwner = safe.owners[1].value
    const preSwappedOwner = safe.owners[0].value
    const postSwappedOwner = checksumAddress(faker.finance.ethereumAddress())
    const newThreshold = safe.threshold + 1

    const multiSendData = encodeMultiSendData([
      {
        data: safeInterface.encodeFunctionData('addOwnerWithThreshold', [addedOwner, safe.threshold]),
        value: '0',
        to: safe.address.value,
        operation: 0,
      },
      {
        data: safeInterface.encodeFunctionData('removeOwner', [safe.owners[0].value, removedOwner, safe.threshold]),
        value: '0',
        to: safe.address.value,
        operation: 0,
      },
      {
        data: safeInterface.encodeFunctionData('swapOwner', [SENTINEL_ADDRESS, preSwappedOwner, postSwappedOwner]),
        value: '0',
        to: safe.address.value,
        operation: 0,
      },
      {
        data: safeInterface.encodeFunctionData('changeThreshold', [newThreshold]),
        value: '0',
        to: safe.address.value,
        operation: 0,
      },
    ])

    const transaction = {
      to: multiSendAddress,
      value: '0',
      data: multiSendInterface.encodeFunctionData('multiSend', [multiSendData]),
    }

    expect(getRecoveredSafeInfo(safe, transaction)).toStrictEqual({
      ...safe,
      owners: safe.owners
        .concat([{ value: addedOwner }])
        .filter((owner) => !sameAddress(owner.value, removedOwner))
        .map((owner) => (sameAddress(owner.value, preSwappedOwner) ? { value: postSwappedOwner } : owner)),
      threshold: newThreshold,
    })
  })
})
