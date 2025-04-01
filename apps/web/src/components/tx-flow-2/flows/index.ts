import dynamic from 'next/dynamic'

export const ConfirmTxFlow = dynamic(() => import('./ConfirmTx'))
