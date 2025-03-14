import dynamic from 'next/dynamic'

const EnableSafenetFlow = dynamic(() => import('./EnableSafenetFlow'), { ssr: false })

export default EnableSafenetFlow
