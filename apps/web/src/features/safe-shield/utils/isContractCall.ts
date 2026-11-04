import type { SafeTransaction } from '@safe-global/types-kit'

/** A native transfer carries no calldata, so there is no contract to check. */
export const isContractCall = (safeTx?: SafeTransaction): boolean => !!safeTx?.data.data && safeTx.data.data !== '0x'
