import dynamic from 'next/dynamic'

const SafenetInfoCard = dynamic(() => import('./SafenetInfoCard'), { ssr: false })

export default SafenetInfoCard
