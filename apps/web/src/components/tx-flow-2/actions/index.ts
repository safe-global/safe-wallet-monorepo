import dynamic from 'next/dynamic'

export const Counterfactual = dynamic(() => import('./Counterfactual'))
export const Execute = dynamic(() => import('./Execute'))
export const ExecuteThroughRole = dynamic(() => import('./ExecuteThroughRole'))
export const Propose = dynamic(() => import('./Propose'))
export const Sign = dynamic(() => import('./Sign'))
