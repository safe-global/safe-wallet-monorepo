import dynamic from 'next/dynamic'

const SafenetTxStatusSteps = dynamic(import('./SafenetTxStatusSteps'), { ssr: false })

export default SafenetTxStatusSteps
