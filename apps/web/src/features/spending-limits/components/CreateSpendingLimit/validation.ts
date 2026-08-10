import { parseUnits, AbiCoder } from 'ethers'

export const _validateSpendingLimit = (val: string, decimals?: number | null) => {
  // Allowance amount is uint96 https://github.com/safe-global/safe-modules/blob/main/modules/allowances/contracts/AllowanceModule.sol#L52
  try {
    const amount = parseUnits(val, decimals ?? 'Gwei')
    AbiCoder.defaultAbiCoder().encode(['int96'], [amount])
  } catch (e) {
    return Number(val) > 1 ? 'Amount is too big' : 'Amount is too small'
  }
}
