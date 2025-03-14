import dynamic from 'next/dynamic'

const SafenetBalanceBreakdown = dynamic(import('./SafenetBalanceBreakdown'), { ssr: false })

export default SafenetBalanceBreakdown
