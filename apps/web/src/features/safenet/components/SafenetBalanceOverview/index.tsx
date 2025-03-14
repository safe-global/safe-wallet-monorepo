import dynamic from 'next/dynamic'

const SafenetBalanceOverview = dynamic(() => import('./SafenetBalanceOverview'))

export default SafenetBalanceOverview
