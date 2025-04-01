import dynamic from 'next/dynamic'

export const TxChecks = dynamic(() => import('./TxChecks'))
