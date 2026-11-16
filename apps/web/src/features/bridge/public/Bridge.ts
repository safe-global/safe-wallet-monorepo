import dynamic from '@/utils/dynamic'

// Not gated: the Bridge component redirects home itself when the chain has no bridge
const Bridge = dynamic(() => import('../components/Bridge').then((mod) => ({ default: mod.Bridge })), { ssr: false })

export default Bridge
