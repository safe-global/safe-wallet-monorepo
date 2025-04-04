import dynamic from 'next/dynamic'

export const TxChecks = dynamic(() => import('./TxChecks'))
export const TxNote = dynamic(() => import('./TxNote'))
export const SignerSelect = dynamic(() => import('./SignerSelect'))
