import dynamic from 'next/dynamic'

export { BRIDGE_WIDGET_URL, LOCAL_STORAGE_CONSENT_KEY } from './constants'

const Bridge = dynamic(() => import('./components/Bridge').then((mod) => ({ default: mod.Bridge })), { ssr: false })

export default Bridge
