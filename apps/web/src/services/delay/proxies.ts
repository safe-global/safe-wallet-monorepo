import type { JsonRpcProvider } from 'ethers'
import { Contract } from 'ethers'

// zodiac-safe-app used as reference for proxy detection
// @see https://github.com/gnosis/zodiac-safe-app/blob/e5d6d3d251d128245104ddc638e26d290689bb14/packages/app/src/utils/modulesValidation.ts

export function isGenericProxy(bytecode: string): boolean {
  if (bytecode.length !== 92) {
    return false
  }

  return bytecode.startsWith('0x363d3d373d3d3d363d73') && bytecode.endsWith('5af43d82803e903d91602b57fd5bf3')
}

export function getGenericProxyMasterCopy(bytecode: string): string {
  return '0x' + bytecode.slice(22, 62)
}

export function isGnosisProxy(bytecode: string): boolean {
  return (
    bytecode.toLowerCase() ===
    '0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea265627a7a72315820d8a00dc4fe6bf675a9d7416fc2d00bb3433362aa8186b750f76c4027269667ff64736f6c634300050e0032'
  )
}

export async function getGnosisProxyMasterCopy(address: string, provider: JsonRpcProvider): Promise<string> {
  const gnosisProxyAbi = ['function masterCopy() external view returns (address)']
  const gnosisProxyContract = new Contract(address, gnosisProxyAbi, provider)

  return gnosisProxyContract.masterCopy()
}
