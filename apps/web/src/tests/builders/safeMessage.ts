import type { MessageItem, TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { Builder, type IBuilder } from '@/tests/Builder'
import { faker } from '@faker-js/faker'

export function safeMsgBuilder(): IBuilder<MessageItem> {
  return Builder.new<MessageItem>().with({
    type: 'MESSAGE',
    messageHash: faker.string.hexadecimal(),
    status: 'NEEDS_CONFIRMATION',
    logoUri: null,
    name: null,
    message: 'Message text',
    creationTimestamp: faker.date.past().getTime(),
    modifiedTimestamp: faker.date.past().getTime(),
    confirmationsSubmitted: 1,
    confirmationsRequired: 2,
    proposedBy: { value: faker.finance.ethereumAddress() },
    confirmations: [
      {
        owner: { value: faker.finance.ethereumAddress() },
        signature: '',
      },
    ],
    preparedSignature: null,
    origin: null,
    safeAppInfo: null,
    safeAppId: null,
  })
}

export const NESTED_TYPED_DATA_TEXT = 'Test message 3 off-chain'

export const nestedTypedDataValue = {
  nestedString: NESTED_TYPED_DATA_TEXT,
  nestedAddress: '0x0000000000000000000000000000000000000002',
  nestedUint256: '0',
  nestedUint32: '1',
  nestedBytes32: '0x000000000000000000000000000000000000000000000000000000000000da7a',
  nestedBoolean: false,
}

export const nestedTypedData: TypedData = {
  domain: {
    name: 'EIP-1271 Example DApp',
    version: '1.0',
    chainId: 11155111,
    verifyingContract: '0xc2F3645bfd395516d1a18CA6ad9298299d328C01',
  },
  primaryType: 'Example',
  types: {
    Nested: [
      { name: 'nestedString', type: 'string' },
      { name: 'nestedAddress', type: 'address' },
      { name: 'nestedUint256', type: 'uint256' },
      { name: 'nestedUint32', type: 'uint32' },
      { name: 'nestedBytes32', type: 'bytes32' },
      { name: 'nestedBoolean', type: 'bool' },
    ],
    Example: [
      { name: 'testString', type: 'string' },
      { name: 'testAddress', type: 'address' },
      { name: 'testUint256', type: 'uint256' },
      { name: 'testUint32', type: 'uint32' },
      { name: 'testBytes32', type: 'bytes32' },
      { name: 'testBoolean', type: 'bool' },
      { name: 'testNested', type: 'Nested' },
      { name: 'testNestedArray', type: 'Nested[]' },
    ],
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
  },
  message: {
    testString: NESTED_TYPED_DATA_TEXT,
    testAddress: '0xc2f3645bfd395516d1a18ca6ad9298299d328c01',
    testUint256: '115792089237316195423570985008687907853269984665640564039457584007908834671663',
    testUint32: '123',
    testBytes32: '0x00000000000000000000000000000000000000000000000000000000deadbeef',
    testBoolean: true,
    testNested: nestedTypedDataValue,
    testNestedArray: [nestedTypedDataValue, nestedTypedDataValue],
  },
}
