import dynamic from 'next/dynamic'

const SafenetNetworkSelector = dynamic(import('./SafenetNetworkSelector'), { ssr: false })

export default SafenetNetworkSelector
