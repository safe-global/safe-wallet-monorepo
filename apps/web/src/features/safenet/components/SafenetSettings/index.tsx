import dynamic from 'next/dynamic'

const SafenetSettings = dynamic(() => import('./SafenetSettings'))

export default SafenetSettings
