import dynamic from 'next/dynamic'

const SafenetTokenTransfers = dynamic(() => import('./SafenetTokenTransfers'), { ssr: false })

export default SafenetTokenTransfers
