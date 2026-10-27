/** ERC20 transfer selectors the ERC20TransferPolicy restricts. Source: safe-research/policy-engine. */
export const ERC20_TRANSFER_SELECTOR = '0xa9059cbb' // transfer(address,uint256)
export const ERC20_TRANSFER_FROM_SELECTOR = '0x23b872dd' // transferFrom(address,address,uint256)

/** A configuration's `data` is `abi.encode(RecipientData[])`, one permission per recipient. */
export const RECIPIENT_DATA_TYPE = 'tuple(address recipient, uint8 permission)[]'

/** No permission: the recipient is removed. */
export const PERMISSION_NONE = 0
/** The recipient may receive the token without limit. */
export const PERMISSION_ALWAYS = 2
