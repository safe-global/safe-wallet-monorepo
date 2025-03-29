import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { id } from 'ethers'

export const APPROVAL_SIGNATURE_HASH = id('approve(address,uint256)').slice(0, 10)
export const INCREASE_ALLOWANCE_SIGNATURE_HASH = id('increaseAllowance(address,uint256)').slice(0, 10)
export const ERC20_INTERFACE = ERC20__factory.createInterface()