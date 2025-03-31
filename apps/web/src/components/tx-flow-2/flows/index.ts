import dynamic from 'next/dynamic'

export const ChangeThresholdFlow = dynamic(() => import('./ChangeThreshold'))
export const ConfirmTxFlow = dynamic(() => import('./ConfirmTx'))
