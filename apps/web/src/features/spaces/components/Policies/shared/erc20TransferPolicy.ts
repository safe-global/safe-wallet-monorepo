/** ERC20 transfer selectors the ERC20TransferPolicy restricts. Source: safe-research/policy-engine. */
export const ERC20_TRANSFER_SELECTOR = '0xa9059cbb' // transfer(address,uint256)
export const ERC20_TRANSFER_FROM_SELECTOR = '0x23b872dd' // transferFrom(address,address,uint256)

/** A configuration's `data` is `abi.encode(RecipientData[])`; `allowed: false` removes a recipient. */
export const RECIPIENT_DATA_TYPE = 'tuple(address recipient, bool allowed)[]'
