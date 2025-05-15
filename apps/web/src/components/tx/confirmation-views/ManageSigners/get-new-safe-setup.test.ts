import { Safe__factory } from '@safe-global/utils/types/contracts'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { TransactionInfoType } from '@safe-global/safe-gateway-typescript-sdk'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'

import { txInfoBuilder } from '@/tests/builders/safeTx'
import { _getTransactionsData, getNewSafeSetup } from './get-new-safe-setup'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { faker } from '@faker-js/faker'

const safeInterface = Safe__factory.createInterface()

describe('getNewSafeSetup', () => {
  it('should return new owners/threshold for addOwnerWithThreshold', () => {
    const ownerToAdd = faker.finance.ethereumAddress()
    const thresholdToSet = faker.number.int({ min: 1, max: 10 })
    const safe = extendedSafeInfoBuilder().build()
    const txInfo = txInfoBuilder().build()
    const txData = {
      hexData: safeInterface.encodeFunctionData('addOwnerWithThreshold', [ownerToAdd, thresholdToSet]),
    } as TransactionDetails['txData']

    const result = getNewSafeSetup({
      txInfo,
      txData,
      safe,
    })

    expect(result).toEqual({
      newOwners: [...safe.owners.map((owner) => owner.value), checksumAddress(ownerToAdd)],
      newThreshold: thresholdToSet,
    })
  })

  it('should return new owners/threshold for removeOwner', () => {
    const prevOwner = faker.finance.ethereumAddress()
    const ownerToRemove = faker.finance.ethereumAddress()
    const thresholdToSet = faker.number.int({ min: 1, max: 10 })
    const safe = extendedSafeInfoBuilder()
      .with({
        owners: [
          {
            value: prevOwner,
          },
          {
            // Test checksum comparison by using lowercase
            value: ownerToRemove.toLowerCase(),
          },
        ],
      })
      .build()
    const txInfo = txInfoBuilder().build()
    const txData = {
      hexData: safeInterface.encodeFunctionData('removeOwner', [prevOwner, ownerToRemove, thresholdToSet]),
    } as TransactionDetails['txData']

    const result = getNewSafeSetup({
      txInfo,
      txData,
      safe,
    })

    expect(result).toEqual({
      newOwners: [prevOwner],
      newThreshold: thresholdToSet,
    })
  })

  it('should return new owners/threshold for swapOwner', () => {
    const prevOwner = faker.finance.ethereumAddress()
    const ownerToRemove = faker.finance.ethereumAddress()
    const ownerToAdd = faker.finance.ethereumAddress()
    const safe = extendedSafeInfoBuilder()
      .with({
        owners: [
          {
            value: prevOwner,
          },
          {
            // Test checksum comparison by using lowercase
            value: ownerToRemove.toLowerCase(),
          },
        ],
      })
      .build()
    const txInfo = txInfoBuilder().build()
    const txData = {
      hexData: safeInterface.encodeFunctionData('swapOwner', [prevOwner, ownerToRemove, ownerToAdd]),
    } as TransactionDetails['txData']

    const result = getNewSafeSetup({
      txInfo,
      txData,
      safe,
    })

    expect(result).toEqual({
      newOwners: [prevOwner, checksumAddress(ownerToAdd)],
      newThreshold: safe.threshold,
    })
  })

  it('should return new owners/threshold for changeThreshold', () => {
    const thresholdToSet = faker.number.int({ min: 1, max: 10 })
    const safe = extendedSafeInfoBuilder().build()
    const txInfo = txInfoBuilder().build()
    const txData = {
      hexData: safeInterface.encodeFunctionData('changeThreshold', [thresholdToSet]),
    } as TransactionDetails['txData']

    const result = getNewSafeSetup({
      txInfo,
      txData,
      safe,
    })

    expect(result).toEqual({
      newOwners: safe.owners.map((owner) => owner.value),
      newThreshold: thresholdToSet,
    })
  })

  it('should return new owners/threshold for batched signer management', () => {
    const ownerToAdd = faker.finance.ethereumAddress()
    const prevOwner = faker.finance.ethereumAddress()
    const ownerToRemove = faker.finance.ethereumAddress()
    const thresholdToSet = faker.number.int({ min: 1, max: 10 })
    const safe = extendedSafeInfoBuilder()
      .with({
        owners: [
          {
            value: prevOwner,
          },
          {
            // Test checksum comparison by using lowercase
            value: ownerToRemove.toLowerCase(),
          },
        ],
      })
      .build()
    const txInfo = txInfoBuilder()
      .with({
        type: TransactionInfoType.CUSTOM,
        methodName: 'multiSend',
        actionCount: 3,
      })
      .build()
    const txData = {
      dataDecoded: {
        parameters: [
          {
            valueDecoded: [
              {
                data: safeInterface.encodeFunctionData('addOwnerWithThreshold', [ownerToAdd, thresholdToSet]),
              },
              {
                data: safeInterface.encodeFunctionData('removeOwner', [prevOwner, ownerToRemove, thresholdToSet]),
              },
              {
                data: safeInterface.encodeFunctionData('changeThreshold', [thresholdToSet]),
              },
            ],
          },
        ],
      },
    } as TransactionDetails['txData']

    const result = getNewSafeSetup({
      txInfo,
      txData,
      safe,
    })

    expect(result).toEqual({
      newOwners: [prevOwner, checksumAddress(ownerToAdd)],
      newThreshold: thresholdToSet,
    })
  })
})

describe('getTransactionsData', () => {
  it('should return the direct data of non-multiSend transactions', () => {
    const txInfo = txInfoBuilder().build()
    const txData = {
      hexData: '0x1',
    } as TransactionDetails['txData']

    const result = _getTransactionsData(txInfo, txData)

    expect(result).toEqual(['0x1'])
  })

  it('should return the decoded data of multiSend transactions', () => {
    const txInfo = txInfoBuilder()
      .with({
        type: TransactionInfoType.CUSTOM,
        methodName: 'multiSend',
        actionCount: 3,
      })
      .build()
    const txData = {
      dataDecoded: {
        parameters: [
          {
            valueDecoded: [
              {
                data: '0x1',
              },
              {
                data: '0x2',
              },
              {
                data: '0x3',
              },
            ],
          },
        ],
      },
    } as TransactionDetails['txData']

    const result = _getTransactionsData(txInfo, txData)

    expect(result).toEqual(['0x1', '0x2', '0x3'])
  })
})
