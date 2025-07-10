import { migrateAddressBook } from './addressBook'
import { migrateAddedSafes, migrateAddedSafesOwners } from './addedSafes'
import { migrateBatchTxs } from './batch'
import { type BatchTxsState } from '@/store/batchSlice'
import { OperationType } from '@safe-global/types-kit'
import { Operation, TransactionStatus, type TransactionInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { faker } from '@faker-js/faker'
import { ERC20_INTERFACE } from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'

describe('Local storage migration', () => {
  describe('migrateAddressBook', () => {
    it('should migrate the address book', () => {
      const oldStorage = {
        SAFE__addressBook: JSON.stringify([
          { address: '0x1F2504De05f5167650bE5B28c472601Be434b60A', name: 'Alice', chainId: '1' },
          { address: '0x501E66bF7a8F742FA40509588eE751e93fA354Df', name: 'Bob', chainId: '1' },
          { address: '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808', name: 'Charlie', chainId: '5' },
          { address: '0x979774d85274A5F63C85786aC4Fa54B9A4f391c2', name: 'Dave', chainId: '5' },
        ]),
      }

      const newData = migrateAddressBook(oldStorage)

      expect(newData).toEqual({
        '1': {
          '0x1F2504De05f5167650bE5B28c472601Be434b60A': 'Alice',
          '0x501E66bF7a8F742FA40509588eE751e93fA354Df': 'Bob',
        },
        '5': {
          '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808': 'Charlie',
          '0x979774d85274A5F63C85786aC4Fa54B9A4f391c2': 'Dave',
        },
      })
    })

    it('should not add empty names', () => {
      const oldStorage = {
        SAFE__addressBook: JSON.stringify([
          { address: '0x1F2504De05f5167650bE5B28c472601Be434b60A', name: 'Alice', chainId: '1' },
          { address: '0x501E66bF7a8F742FA40509588eE751e93fA354Df', name: '', chainId: '1' },
          { address: '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808', name: 'Charlie', chainId: '5' },
          { address: '0x979774d85274A5F63C85786aC4Fa54B9A4f391c2', name: undefined, chainId: '5' },
        ]),
      }

      const newData = migrateAddressBook(oldStorage)

      expect(newData).toEqual({
        '1': {
          '0x1F2504De05f5167650bE5B28c472601Be434b60A': 'Alice',
        },
        '5': {
          '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808': 'Charlie',
        },
      })
    })

    it('should not add rinkeby addresses', () => {
      const oldStorage = {
        SAFE__addressBook: JSON.stringify([
          { address: '0x1F2504De05f5167650bE5B28c472601Be434b60A', name: 'Alice', chainId: '4' },
          { address: '0x501E66bF7a8F742FA40509588eE751e93fA354Df', name: 'Berta', chainId: '4' },
          { address: '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808', name: 'Charlie', chainId: '4' },
        ]),
      }

      const newData = migrateAddressBook(oldStorage)
      expect(newData).toEqual(undefined)
    })

    it('should not add invalid addresses', () => {
      const oldStorage = {
        SAFE__addressBook: JSON.stringify([
          { address: '0x1F2504De05f5167650bE5B28c472601Be434b60A', name: 'Alice', chainId: '1' },
          { address: 'sdfgsdfg', name: 'Bob', chainId: '1' },
          { address: '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808', name: 'Charlie', chainId: '5' },
          { address: '0x62da87ff2e2216f1858603a3db9313e178da3112 ', name: 'Not checksummed', chainId: '5' },
          { address: '', name: 'Dave', chainId: '5' },
          { address: undefined, name: 'John', chainId: '5' },
        ]),
      }

      const newData = migrateAddressBook(oldStorage)

      expect(newData).toEqual({
        '1': {
          '0x1F2504De05f5167650bE5B28c472601Be434b60A': 'Alice',
        },
        '5': {
          '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808': 'Charlie',
        },
      })
    })

    it('should return undefined if there are no address book entries', () => {
      const newData = migrateAddressBook({
        SAFE__addressBook: '[]',
      })

      expect(newData).toEqual(undefined)
    })
  })

  describe('migratedAddedSafesOwners', () => {
    it('should migrate the owners of the added Safes', () => {
      const oldOwners = [
        {
          address: '0x1F2504De05f5167650bE5B28c472601Be434b60A',
        },
        {
          address: '0x501E66bF7a8F742FA40509588eE751e93fA354Df',
          name: 'Alice',
        },
        {
          address: '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808',
          name: 'Bob',
        },
        '0xdef',
      ]

      const newData = migrateAddedSafesOwners(oldOwners)

      expect(newData).toEqual([
        {
          value: '0x1F2504De05f5167650bE5B28c472601Be434b60A',
        },
        {
          value: '0x501E66bF7a8F742FA40509588eE751e93fA354Df',
          name: 'Alice',
        },
        {
          value: '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808',
          name: 'Bob',
        },
      ])
    })

    it('should return undefined if there are no owners', () => {
      const newData = migrateAddedSafesOwners([])

      expect(newData).toEqual(undefined)
    })

    it('should format invalid owners', () => {
      const oldOwners = [
        {
          address: '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808',
          name: 'Bob',
        },
        {
          address: '0x501E66bF7a8F742FA40509588eE751e93fA354Df',
          name: 123,
        },
        {
          address: 123,
          name: 'Alice',
        },
        '0xdef',
        { invalid: 'Object' },
        null,
        true,
      ] as Parameters<typeof migrateAddedSafesOwners>[0]

      const newData = migrateAddedSafesOwners(oldOwners)

      expect(newData).toEqual([
        {
          value: '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808',
          name: 'Bob',
        },
        {
          value: '0x501E66bF7a8F742FA40509588eE751e93fA354Df',
        },
      ])
    })

    it('should undefined if all owners are invalid', () => {
      const oldOwners = [
        {
          address: 123,
          name: 'Alice',
        },
        { invalid: 'Object' } as unknown as Parameters<typeof migrateAddedSafesOwners>[0][number],
        null,
        true,
      ] as Parameters<typeof migrateAddedSafesOwners>[0]

      const newData = migrateAddedSafesOwners(oldOwners)

      expect(newData).toEqual(undefined)
    })
  })

  describe('migrateAddedSafes', () => {
    const oldStorage = {
      '_immortal|v2_MAINNET__SAFES': JSON.stringify({
        '0x1F2504De05f5167650bE5B28c472601Be434b60A': {
          address: '0x1F2504De05f5167650bE5B28c472601Be434b60A',
          chainId: '1',
          ethBalance: '0.1',
          owners: ['0x1F2504De05f5167650bE5B28c472601Be434b60A'],
          threshold: 1,
        },
        '0x501E66bF7a8F742FA40509588eE751e93fA354Df': {
          address: '0x501E66bF7a8F742FA40509588eE751e93fA354Df',
          chainId: '1',
          ethBalance: '20.3',
          owners: [
            '0x501E66bF7a8F742FA40509588eE751e93fA354Df',
            { address: '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808', name: 'Charlie' },
            { invalid: 'Object' },
            null,
            true,
            123,
          ],
          threshold: 2,
        },
      }),
      '_immortal|v2_1313161554__SAFES': JSON.stringify({
        '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808': {
          address: '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808',
          chainId: '1313161554',
          ethBalance: '0',
          owners: ['0x9913B9180C20C6b0F21B6480c84422F6ebc4B808'],
          threshold: 1,
        },
        '0x979774d85274A5F63C85786aC4Fa54B9A4f391c2': {
          address: '0x979774d85274A5F63C85786aC4Fa54B9A4f391c2',
          chainId: '1313161554',
          ethBalance: '0.00001',
          owners: [
            '0x979774d85274A5F63C85786aC4Fa54B9A4f391c2',
            '0xdef',
            { address: '0x1F2504De05f5167650bE5B28c472601Be434b60A' },
          ],
          threshold: 2,
        },
      }),
    }

    it('should migrate the added safes', () => {
      const newData = migrateAddedSafes(oldStorage)

      expect(newData).toEqual({
        '1': {
          '0x1F2504De05f5167650bE5B28c472601Be434b60A': {
            ethBalance: '0.1',
            owners: [{ value: '0x1F2504De05f5167650bE5B28c472601Be434b60A' }],
            threshold: 1,
          },
          '0x501E66bF7a8F742FA40509588eE751e93fA354Df': {
            ethBalance: '20.3',
            owners: [
              { value: '0x501E66bF7a8F742FA40509588eE751e93fA354Df' },
              { value: '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808', name: 'Charlie' },
            ],
            threshold: 2,
          },
        },
        '1313161554': {
          '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808': {
            ethBalance: '0',
            owners: [{ value: '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808' }],
            threshold: 1,
          },
          '0x979774d85274A5F63C85786aC4Fa54B9A4f391c2': {
            ethBalance: '0.00001',
            owners: [
              { value: '0x979774d85274A5F63C85786aC4Fa54B9A4f391c2' },
              { value: '0x1F2504De05f5167650bE5B28c472601Be434b60A' },
            ],
            threshold: 2,
          },
        },
      })
    })

    it('should return undefined if there are no added safes', () => {
      const newData = migrateAddedSafes({
        '_immortal|v2_MAINNET__SAFES': '{}',
      })

      expect(newData).toEqual(undefined)
    })
  })

  describe('migrateBatchTxs', () => {
    it('should migrate empty state', () => {
      const oldStorage: BatchTxsState = {}

      const newData = migrateBatchTxs(oldStorage)

      expect(newData).toEqual(oldStorage)
    })

    it('should migrate state with new txData', () => {
      const oldStorage: BatchTxsState = {
        '1': {
          '0x1F2504De05f5167650bE5B28c472601Be434b60A': [
            {
              id: '123',
              timestamp: Date.now(),
              txData: {
                to: '0x1F2504De05f5167650bE5B28c472601Be434b60A',
                value: '0',
                data: '0x',
                operation: OperationType.Call,
              },
            },
          ],
        },
      }

      const newData = migrateBatchTxs(oldStorage)

      expect(newData).toEqual(oldStorage)
    })

    it('should migrate txDetails to txData', () => {
      const to1 = faker.finance.ethereumAddress()
      const erc20Token = faker.finance.ethereumAddress()
      const to2 = faker.finance.ethereumAddress()
      const timestamp = Date.now()

      const oldStorage = {
        '1': {
          '0x1F2504De05f5167650bE5B28c472601Be434b60A': [
            {
              id: '123',
              timestamp,
              txDetails: {
                safeAddress: '0x1F2504De05f5167650bE5B28c472601Be434b60A',
                txId: '123',
                txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
                txInfo: {} as unknown as TransactionInfo,
                txData: {
                  to: { value: to1 },
                  value: '420',
                  hexData: '0x',
                  operation: Operation.CALL,
                  trustedDelegateCallTarget: false,
                },
              },
            },
            {
              id: '234',
              timestamp,
              txDetails: {
                safeAddress: '0x1F2504De05f5167650bE5B28c472601Be434b60A',
                txId: '234',
                txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
                txInfo: {} as unknown as TransactionInfo,
                txData: {
                  to: { value: erc20Token },
                  value: '0',
                  hexData: ERC20_INTERFACE.encodeFunctionData('transfer', [to2, '69']),
                  operation: Operation.CALL,
                  trustedDelegateCallTarget: false,
                },
              },
            },
          ],
        },
      }

      const newData = migrateBatchTxs(oldStorage as unknown as BatchTxsState)

      expect(newData).toEqual({
        '1': {
          '0x1F2504De05f5167650bE5B28c472601Be434b60A': [
            {
              id: '123',
              timestamp,
              txData: {
                to: to1,
                value: '420',
                data: '0x',
                operation: OperationType.Call,
              },
            },
            {
              id: '234',
              timestamp,
              txData: {
                to: erc20Token,
                value: '0',
                data: ERC20_INTERFACE.encodeFunctionData('transfer', [to2, '69']),
                operation: OperationType.Call,
              },
            },
          ],
        },
      })
    })
  })
})
