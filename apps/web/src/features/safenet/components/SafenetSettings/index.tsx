import dynamic from 'next/dynamic'

const SafenetSettings = dynamic(() => import('./SafenetSettings'), { ssr: false })

export default SafenetSettings
