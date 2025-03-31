import dynamic from 'next/dynamic'

export const Batching = dynamic(() => import('./Batching'))
export const TxChecks = dynamic(() => import('./TxChecks'))
