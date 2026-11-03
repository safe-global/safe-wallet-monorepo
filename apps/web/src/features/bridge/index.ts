import dynamic from '@/utils/dynamic'

const Bridge = dynamic(() => import('./components/Bridge').then((mod) => ({ default: mod.Bridge })), { ssr: false })

export default Bridge
