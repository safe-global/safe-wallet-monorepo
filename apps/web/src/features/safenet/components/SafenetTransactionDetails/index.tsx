import dynamic from 'next/dynamic'

const SafenetTransactionDetails = dynamic(import('./SafenetTransactionDetails'), { ssr: false })

export default SafenetTransactionDetails
