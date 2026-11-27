// import type {BigNumberish, BigNumber}    from 'ethers'
// import { type BigNumber } from '@ethersproject/bignumber'

export enum AdvancedField {
  nonce = 'nonce',
  userNonce = 'userNonce',
  gasLimit = 'gasLimit',
  maxFeePerGas = 'maxFeePerGas',
  maxPriorityFeePerGas = 'maxPriorityFeePerGas',
  safeTxGas = 'safeTxGas',
}

export type AdvancedParameters = Partial<{
  [AdvancedField.nonce]: number
  [AdvancedField.userNonce]: number
  [AdvancedField.gasLimit]: bigint | null
  [AdvancedField.maxFeePerGas]: bigint | null
  [AdvancedField.maxPriorityFeePerGas]: bigint | null
  [AdvancedField.safeTxGas]: number
}>
