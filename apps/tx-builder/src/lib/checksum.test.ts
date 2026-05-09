import { addChecksum, validateChecksum } from './checksum'
import { BatchFile } from '../typings/models'

const batchFileObject: BatchFile = {
  version: '1.0',
  chainId: '4',
  createdAt: 1646321521061,
  meta: {
    name: 'test batch file',
    txBuilderVersion: '1.4.0',
    checksum: '',
    createdFromSafeAddress: '0xDF8a1Ce35c9a6ACE153B4e0767942f1E2291a1Aa',
    createdFromOwnerAddress: '0x49d4450977E2c95362C13D3a31a09311E0Ea26A6',
  },
  transactions: [
    {
      to: '0x49d4450977E2c95362C13D3a31a09311E0Ea26A6',
      value: '0',
      contractMethod: {
        inputs: [
          {
            internalType: 'address',
            name: 'paramAddress',
            type: 'address',
          },
        ],
        name: 'testAddress',
        payable: false,
      },
      contractInputsValues: {
        paramAddress: '0x49d4450977E2c95362C13D3a31a09311E0Ea26A6',
      },
    },
    {
      to: '0x49d4450977E2c95362C13D3a31a09311E0Ea26A6',
      value: '0',
      contractMethod: {
        inputs: [
          {
            internalType: 'bool',
            name: 'paramBool',
            type: 'bool',
          },
        ],
        name: 'testBool',
        payable: false,
      },
      contractInputsValues: {
        paramAddress: '',
        paramBool: 'false',
      },
    },
    {
      to: '0x49d4450977E2c95362C13D3a31a09311E0Ea26A6',
      value: '2000000000000000000',
      data: '0x42f4579000000000000000000000000049d4450977e2c95362c13d3a31a09311e0ea26a6',
    },
  ],
}

describe('checksum', () => {
  test('Add checksum to BatchFile', () => {
    const batchFileWithChecksum = addChecksum(batchFileObject)
    expect(batchFileWithChecksum.meta.checksum).toBe(
      '0x86c81826dbf7e8a37612153294cc85fdf5c81998dd0a44b86d945502a7eace7c',
    )
  })

  test('Validate checksum in BatchFile', () => {
    const batchFileWithChecksum = addChecksum(batchFileObject)
    expect(validateChecksum(batchFileWithChecksum)).toBe(true)
  })

  test('Checksum should remain the same when the properties order is not equal', () => {
    const batchFileWithChecksum = addChecksum(reverseBatchFileProps(batchFileObject))
    expect(batchFileWithChecksum.meta.checksum).toBe(
      '0x86c81826dbf7e8a37612153294cc85fdf5c81998dd0a44b86d945502a7eace7c',
    )
  })

  test('Validation should fail if we change transaction order', () => {
    const batchFileWithChecksum = addChecksum(batchFileObject)
    const batchFileObjectCopy = { ...batchFileObject, transactions: [...batchFileObject.transactions] }
    batchFileObjectCopy.transactions.reverse()
    const batchFileCopyWithChecksumAndTransactionsReversed = addChecksum(batchFileObjectCopy)
    expect(batchFileWithChecksum.meta.checksum).not.toBe(batchFileCopyWithChecksumAndTransactionsReversed.meta.checksum)
  })
})

const reverseBatchFileProps = (original: BatchFile): BatchFile => {
  const reversedProps: Record<string, unknown> = {}

  Object.keys(original)
    .reverse()
    .forEach((key) => {
      const typedKey = key as keyof BatchFile
      if (typedKey === 'meta') {
        const metaObject: Record<string, unknown> = {}
        Object.keys(original.meta)
          .reverse()
          .forEach((metaObjectKey) => {
            metaObject[metaObjectKey] = original.meta[metaObjectKey as keyof typeof original.meta]
          })
        reversedProps[key] = metaObject
        return
      }

      reversedProps[key] = original[typedKey]
    })

  return reversedProps as unknown as BatchFile
}
