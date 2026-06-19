/** Shared copy for the fee info bottom sheets, used by the fees breakdown and the execute footer. */
export const EXECUTION_FEE_INFO =
  'Covers third-party services required to securely execute this transaction. Based on the transaction amount. Currently free while the new model is introduced.'

export const GAS_FEE_INFO = 'Network cost required to process this transaction.'

export const gasFeeInfo = (paidFromSafe: boolean): string =>
  `${GAS_FEE_INFO} ${paidFromSafe ? 'Paid from the Safe' : 'Paid from the signer'}`
