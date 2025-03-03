import dynamic from 'next/dynamic'

const SafenetAccountList = dynamic(() => import('./SafenetAccountList'), { ssr: false })

export default SafenetAccountList
