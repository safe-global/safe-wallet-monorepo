import dynamic from 'next/dynamic'

const SafenetSidebarHeader = dynamic(() => import('./SafenetSidebarHeader'), { ssr: false })

export default SafenetSidebarHeader
