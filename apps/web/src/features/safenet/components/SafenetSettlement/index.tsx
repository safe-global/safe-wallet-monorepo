import dynamic from 'next/dynamic'

const SafenetSettlement = dynamic(import('./SafenetSettlement'), { ssr: false })

export default SafenetSettlement
