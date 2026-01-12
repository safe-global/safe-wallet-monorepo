import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'

export const generateAddress = (): string => {
  return faker.finance.ethereumAddress()
}

export const generateChecksummedAddress = (): `0x${string}` => {
  return getAddress(faker.finance.ethereumAddress()) as `0x${string}`
}

export const generatePrivateKey = (): string => {
  return faker.string.hexadecimal({ length: 64, prefix: '0x' })
}

export const generateTxHash = (): string => {
  return `0x${faker.string.hexadecimal({ length: 64, prefix: '' })}`
}

export const generateSafeTxHash = (): string => {
  return `0x${faker.string.hexadecimal({ length: 64, prefix: '' })}`
}

export const generateSignature = (): string => {
  return faker.string.hexadecimal({ length: 130, prefix: '0x' })
}

export const generateTaskId = (): string => {
  return faker.string.uuid()
}

export const generateTxId = (): string => {
  return faker.string.uuid()
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
