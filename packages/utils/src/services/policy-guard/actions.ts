import { sameAddress } from '@safe-global/utils/utils/addresses'

export const MULTI_SEND_SELECTOR = '0x8d80ff0a'

export const ERC20_TRANSFER_SELECTOR = '0xa9059cbb'
export const ERC20_TRANSFER_FROM_SELECTOR = '0x23b872dd'

export const SAFE_MANAGEMENT_SELECTORS: readonly string[] = [
  '0x0d582f13', // addOwnerWithThreshold(address,uint256)
  '0xf8dc5dd9', // removeOwner(address,address,uint256)
  '0xe318b52b', // swapOwner(address,address,address)
  '0x694e80c3', // changeThreshold(uint256)
  '0xe19a9dd9', // setGuard(address)
  '0x610b5925', // enableModule(address)
  '0xe009cfde', // disableModule(address,address)
  '0xe068df37', // setModuleGuard(address)
  '0xf08a0323', // setFallbackHandler(address)
]

const selectorOf = (data: string | undefined): string =>
  data && data.length >= 10 ? data.slice(0, 10).toLowerCase() : '0x'

export type GuardAction = 'erc20-transfer' | 'native-transfer' | 'multisend' | 'safe-management' | 'other'

const OPERATION_DELEGATECALL = 1

export const classifyGuardAction = (
  tx: { to: string; value: string | bigint; data: string; operation: number },
  safeAddress: string,
): GuardAction => {
  const selector = selectorOf(tx.data)

  if (tx.operation === OPERATION_DELEGATECALL) {
    return selector === MULTI_SEND_SELECTOR ? 'multisend' : 'other'
  }

  if (sameAddress(tx.to, safeAddress) && SAFE_MANAGEMENT_SELECTORS.includes(selector)) {
    return 'safe-management'
  }

  if (selector === ERC20_TRANSFER_SELECTOR || selector === ERC20_TRANSFER_FROM_SELECTOR) {
    return 'erc20-transfer'
  }

  if (selector === '0x' && BigInt(tx.value) > 0n) return 'native-transfer'

  return 'other'
}
