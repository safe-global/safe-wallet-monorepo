import dynamic from 'next/dynamic'

const SafenetMultichainIndicator = dynamic(() => import('./SafenetMultichainIndicator'), { ssr: false })

export default SafenetMultichainIndicator
