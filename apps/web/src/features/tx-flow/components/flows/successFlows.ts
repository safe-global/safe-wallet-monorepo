/**
 * Lightweight exports for success flow identification.
 * Used by TxModalProvider to check if a flow should skip close confirmation.
 * Separate file to avoid pulling in all flow dynamic imports.
 */
import dynamic from 'next/dynamic'

export const SuccessScreenFlow = dynamic(() => import('./SuccessScreen'))
export const NestedTxSuccessScreenFlow = dynamic(() => import('./NestedTxSuccessScreen'))
