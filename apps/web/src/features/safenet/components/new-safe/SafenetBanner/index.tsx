import dynamic from 'next/dynamic'

const SafenetBanner = dynamic(() => import('./SafenetBanner'), { ssr: false })

export default SafenetBanner
